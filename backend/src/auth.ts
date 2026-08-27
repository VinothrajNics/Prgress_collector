import type { Context, Next } from 'hono';
import type { Env } from './db.js';

export type UserRole = 'admin' | 'client';

export interface AuthUser {
  role: UserRole;
  clientId?: number;
  username: string;
}

export type AppContext = Context<{
  Bindings: Env;
  Variables: {
    authUser: AuthUser;
  };
}>;

const SESSION_DAYS = 7;

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEY_LENGTH = 256;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);

  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }

  return bytes;
}

function generateToken(length = 48): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);

  const hash = await crypto.subtle.digest(
    'SHA-256',
    data
  );

  return bytesToHex(new Uint8Array(hash));
}

/**
 * Password hashing using PBKDF2.
 *
 * Format:
 * pbkdf2:salt:iterations:hash
 */
export async function hashPassword(
  password: string
): Promise<string> {
  const salt = new Uint8Array(16);

  crypto.getRandomValues(salt);

  const keyMaterial =
    await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

  const derivedBits =
    await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      PBKDF2_KEY_LENGTH
    );

  const hash = new Uint8Array(derivedBits);

  return [
    'pbkdf2',
    bytesToHex(salt),
    PBKDF2_ITERATIONS.toString(),
    bytesToHex(hash),
  ].join(':');
}

export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  try {
    const parts = storedHash.split(':');

    if (parts.length !== 4) {
      return false;
    }

    const [
      algorithm,
      saltHex,
      iterationsString,
      storedKeyHex,
    ] = parts;

    if (algorithm !== 'pbkdf2') {
      return false;
    }

    const iterations = Number(iterationsString);

    if (!Number.isInteger(iterations) || iterations <= 0) {
      return false;
    }

    const salt = hexToBytes(saltHex);

    const keyMaterial =
      await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
      );

    const derivedBits =
      await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt,
          iterations,
          hash: 'SHA-256',
        },
        keyMaterial,
        PBKDF2_KEY_LENGTH
      );

    const derivedKey = new Uint8Array(
      derivedBits
    );

    const storedKey =
      hexToBytes(storedKeyHex);

    if (
      derivedKey.length !==
      storedKey.length
    ) {
      return false;
    }

    let difference = 0;

    for (let i = 0; i < derivedKey.length; i++) {
      difference |=
        derivedKey[i] ^ storedKey[i];
    }

    return difference === 0;
  } catch (error) {
    console.error(
      'Password verification error:',
      error
    );

    return false;
  }
}

export async function createSession(
  env: Env,
  role: UserRole,
  clientId?: number
): Promise<string> {
  const token = generateToken(48);

  const tokenHash =
    await sha256(token);

  const expiresAt =
    new Date(
      Date.now() +
        SESSION_DAYS *
          24 *
          60 *
          60 *
          1000
    ).toISOString();

  await env.DB
    .prepare(`
      INSERT INTO sessions (
        token_hash,
        role,
        client_id,
        expires_at
      )
      VALUES (?, ?, ?, ?)
    `)
    .bind(
      tokenHash,
      role,
      clientId ?? null,
      expiresAt
    )
    .run();

  return token;
}

export async function getSession(
  env: Env,
  token: string
): Promise<AuthUser | null> {
  if (!token) {
    return null;
  }

  const tokenHash =
    await sha256(token);

  const result = await env.DB
    .prepare(`
      SELECT
        s.role,
        s.client_id,
        s.expires_at,
        CASE
          WHEN s.role = 'admin'
            THEN 'admin'
          ELSE c.username
        END AS username
      FROM sessions s
      LEFT JOIN clients c
        ON c.id = s.client_id
      WHERE s.token_hash = ?
      LIMIT 1
    `)
    .bind(tokenHash)
    .all();

  const session =
    result.results[0] as
      | {
          role: UserRole;
          client_id: number | null;
          expires_at: string;
          username: string | null;
        }
      | undefined;

  if (!session) {
    return null;
  }

  if (
    new Date(session.expires_at).getTime() <=
    Date.now()
  ) {
    await env.DB
      .prepare(`
        DELETE FROM sessions
        WHERE token_hash = ?
      `)
      .bind(tokenHash)
      .run();

    return null;
  }

  if (!session.username) {
    return null;
  }

  return {
    role: session.role,
    clientId:
      session.client_id !== null
        ? Number(session.client_id)
        : undefined,
    username: session.username,
  };
}

export async function deleteSession(
  env: Env,
  token: string
): Promise<void> {
  const tokenHash =
    await sha256(token);

  await env.DB
    .prepare(`
      DELETE FROM sessions
      WHERE token_hash = ?
    `)
    .bind(tokenHash)
    .run();
}

export async function getAuthUser(
  c: AppContext
): Promise<AuthUser | null> {
  const header =
    c.req.header('Authorization');

  if (
    !header ||
    !header.startsWith('Bearer ')
  ) {
    return null;
  }

  const token =
    header.slice(7).trim();

  if (!token) {
    return null;
  }

  return getSession(
    c.env,
    token
  );
}

export async function requireAuth(
  c: AppContext,
  next: Next
) {
  const user =
    await getAuthUser(c);

  if (!user) {
    return c.json(
      {
        error:
          'Authentication required',
      },
      401
    );
  }

  c.set(
    'authUser',
    user
  );

  await next();
}

export async function requireAdmin(
  c: AppContext,
  next: Next
) {
  const user =
    await getAuthUser(c);

  if (!user) {
    return c.json(
      {
        error:
          'Authentication required',
      },
      401
    );
  }

  if (user.role !== 'admin') {
    return c.json(
      {
        error:
          'Admin access required',
      },
      403
    );
  }

  c.set(
    'authUser',
    user
  );

  await next();
}

export async function requireClient(
  c: AppContext,
  next: Next
) {
  const user =
    await getAuthUser(c);

  if (!user) {
    return c.json(
      {
        error:
          'Authentication required',
      },
      401
    );
  }

  if (
    user.role !== 'client' ||
    !user.clientId
  ) {
    return c.json(
      {
        error:
          'Client access required',
      },
      403
    );
  }

  c.set(
    'authUser',
    user
  );

  await next();
}