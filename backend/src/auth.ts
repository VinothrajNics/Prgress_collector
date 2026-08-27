import { db } from './db.js';
import {
  randomBytes,
  createHash,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'crypto';
import { promisify } from 'util';
import type { Context, Next } from 'hono';

const scrypt = promisify(scryptCallback);

export type UserRole = 'admin' | 'client';

export interface AuthUser {
  role: UserRole;
  clientId?: number;
  username: string;
}

const SESSION_DAYS = 7;

function hashToken(token: string) {
  return createHash('sha256')
    .update(token)
    .digest('hex');
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');

  const derivedKey = (await scrypt(
    password,
    salt,
    64
  )) as Buffer;

  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string
) {
  try {
    const [salt, key] = storedHash.split(':');

    if (!salt || !key) {
      return false;
    }

    const derivedKey = (await scrypt(
      password,
      salt,
      64
    )) as Buffer;

    const storedKey = Buffer.from(key, 'hex');

    if (derivedKey.length !== storedKey.length) {
      return false;
    }

    return timingSafeEqual(
      derivedKey,
      storedKey
    );
  } catch {
    return false;
  }
}

export async function createSession(
  role: UserRole,
  clientId?: number
) {
  const token = randomBytes(48).toString('hex');

  const tokenHash = hashToken(token);

  const expiresAt = new Date(
    Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  await db.execute({
    sql: `
      INSERT INTO sessions (
        token_hash,
        role,
        client_id,
        expires_at
      )
      VALUES (?, ?, ?, ?)
    `,
    args: [
      tokenHash,
      role,
      clientId ?? null,
      expiresAt,
    ],
  });

  return token;
}

export async function getSession(
  token: string
): Promise<AuthUser | null> {
  const tokenHash = hashToken(token);

  const result = await db.execute({
    sql: `
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
    `,
    args: [tokenHash],
  });

  const session = result.rows[0] as any;

  if (!session) {
    return null;
  }

  if (
    new Date(session.expires_at).getTime() <
    Date.now()
  ) {
    await db.execute({
      sql: 'DELETE FROM sessions WHERE token_hash = ?',
      args: [tokenHash],
    });

    return null;
  }

  return {
    role: session.role,
    clientId: session.client_id
      ? Number(session.client_id)
      : undefined,
    username: session.username,
  };
}

export async function deleteSession(
  token: string
) {
  await db.execute({
    sql: `
      DELETE FROM sessions
      WHERE token_hash = ?
    `,
    args: [hashToken(token)],
  });
}

export async function getAuthUser(
  c: Context
) {
  const header = c.req.header('Authorization');

  if (!header?.startsWith('Bearer ')) {
    return null;
  }

  const token = header.slice(7).trim();

  if (!token) {
    return null;
  }

  return getSession(token);
}

export async function requireAuth(
  c: Context,
  next: Next
) {
  const user = await getAuthUser(c);

  if (!user) {
    return c.json(
      { error: 'Authentication required' },
      401
    );
  }

  c.set('authUser', user);

  await next();
}

export async function requireAdmin(
  c: Context,
  next: Next
) {
  const user = await getAuthUser(c);

  if (!user) {
    return c.json(
      { error: 'Authentication required' },
      401
    );
  }

  if (user.role !== 'admin') {
    return c.json(
      { error: 'Admin access required' },
      403
    );
  }

  c.set('authUser', user);

  await next();
}

export async function requireClient(
  c: Context,
  next: Next
) {
  const user = await getAuthUser(c);

  if (!user) {
    return c.json(
      { error: 'Authentication required' },
      401
    );
  }

  if (
    user.role !== 'client' ||
    !user.clientId
  ) {
    return c.json(
      { error: 'Client access required' },
      403
    );
  }

  c.set('authUser', user);

  await next();
}