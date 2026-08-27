import type { Context, Next } from 'hono';
import type { Env } from './db.js';

export type UserRole = 'admin' | 'client';

export interface AuthUser {
  role: UserRole;
  clientId?: number;
  username: string;
}

const SESSION_DAYS = 7;
const PASSWORD_ITERATIONS = 100_000;

/* -------------------------------------------------------
   Helpers
------------------------------------------------------- */

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

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);

  const hash = await crypto.subtle.digest(
    'SHA-256',
    data
  );

  return bytesToHex(new Uint8Array(hash));
}

function randomHex(length = 32): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  return bytesToHex(bytes);
}

/* -------------------------------------------------------
   Password hashing
------------------------------------------------------- */

export async function hashPassword(
  password: string
): Promise<string> {
  const salt = randomHex(16);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: hexToBytes(salt),
      iterations: PASSWORD_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const hash = bytesToHex(
    new Uint8Array(derivedBits)
  );

  return `pbkdf2:${PASSWORD_ITERATIONS}:${salt}:${hash}`;
}

/* -------------------------------------------------------
   Password verification
------------------------------------------------------- */

export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  try {
    const parts = storedHash.split(':');

    /*
      New format:

      pbkdf2:100000:salt:hash
    */

    if (
      parts.length !== 4 ||
      parts[0] !== 'pbkdf2'
    ) {
      return false;
    }

    const iterations = Number(parts[1]);
    const salt = parts[2];
    const expectedHash = parts[3];

    if (
      !iterations ||
      !salt ||
      !expectedHash
    ) {
      return false;
    }

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
          salt: hexToBytes(salt),
          iterations,
          hash: 'SHA-256',
        },
        keyMaterial,
        256
      );

    const actualHash = bytesToHex(
      new Uint8Array(derivedBits)
    );

    return actualHash === expectedHash;
  } catch (error) {
    console.error(
      'Password verification error:',
      error
    );

    return false;
  }
}

/* -------------------------------------------------------
   Create session
------------------------------------------------------- */

export async function createSession(
  db: D1Database,
  role: UserRole,
  clientId?: number
): Promise<string> {
  const token = randomHex(48);

  const tokenHash = await sha256(token);

  const expiresAt = new Date(
    Date.now() +
      SESSION_DAYS *
        24 *
        60 *
        60 *
        1000
  ).toISOString();

  await db
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

/* -------------------------------------------------------
   Get session
------------------------------------------------------- */

export async function getSession(
  db: D1Database,
  token: string
): Promise<AuthUser | null> {
  if (!token) {
    return null;
  }

  const tokenHash = await sha256(token);

  const result = await db
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
    .first<{
      role: UserRole;
      client_id: number | null;
      expires_at: string;
      username: string | null;
    }>();

  if (!result) {
    return null;
  }

  if (
    new Date(result.expires_at).getTime() <=
    Date.now()
  ) {
    await db
      .prepare(`
        DELETE FROM sessions
        WHERE token_hash = ?
      `)
      .bind(tokenHash)
      .run();

    return null;
  }

  /*
    IMPORTANT:
    Client sessions MUST contain client_id.
  */

  if (
    result.role === 'client' &&
    !result.client_id
  ) {
    return null;
  }

  if (!result.username) {
    return null;
  }

  return {
    role: result.role,
    clientId:
      result.client_id !== null
        ? Number(result.client_id)
        : undefined,
    username: result.username,
  };
}

/* -------------------------------------------------------
   Delete session
------------------------------------------------------- */

export async function deleteSession(
  db: D1Database,
  token: string
) {
  const tokenHash = await sha256(token);

  await db
    .prepare(`
      DELETE FROM sessions
      WHERE token_hash = ?
    `)
    .bind(tokenHash)
    .run();
}

/* -------------------------------------------------------
   Get authenticated user
------------------------------------------------------- */

export async function getAuthUser(
  c: Context<{ Bindings: Env }>
): Promise<AuthUser | null> {
  const header =
    c.req.header('Authorization');

  if (
    !header ||
    !header.startsWith('Bearer ')
  ) {
    return null;
  }

  const token = header
    .slice(7)
    .trim();

  if (!token) {
    return null;
  }

  return getSession(
    c.env.DB,
    token
  );
}

/* -------------------------------------------------------
   Require authentication
------------------------------------------------------- */

export async function requireAuth(
  c: Context<{ Bindings: Env }>,
  next: Next
) {
  const user = await getAuthUser(c);

  if (!user) {
    return c.json(
      {
        error: 'Authentication required',
      },
      401
    );
  }

  c.set('authUser', user);

  await next();
}

/* -------------------------------------------------------
   Require admin
------------------------------------------------------- */

export async function requireAdmin(
  c: Context<{ Bindings: Env }>,
  next: Next
) {
  const user = await getAuthUser(c);

  if (!user) {
    return c.json(
      {
        error: 'Authentication required',
      },
      401
    );
  }

  if (user.role !== 'admin') {
    return c.json(
      {
        error: 'Admin access required',
      },
      403
    );
  }

  c.set('authUser', user);

  await next();
}

/* -------------------------------------------------------
   Require client
------------------------------------------------------- */

export async function requireClient(
  c: Context<{ Bindings: Env }>,
  next: Next
) {
  const user = await getAuthUser(c);

  if (!user) {
    return c.json(
      {
        error: 'Authentication required',
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
        error: 'Client access required',
      },
      403
    );
  }

  c.set('authUser', user);

  await next();
}