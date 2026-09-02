import type { Context } from 'hono';
import type { Env } from './db-types.js';
import { parseJsonList } from './db.js';

export type Role = 'admin' | 'client' | 'department';

export interface UserRow {
  id: string;
  clientId: string;
  username: string;
  password: string;
  role: Role;
  name: string;
  email: string;
  status: string;
  departmentIds: string;
}

export interface AuthUser {
  id: string;
  clientId: string;
  username: string;
  name: string;
  email: string;
  role: Role;
  status: string;
  departmentIds: string[];
  clientName: string;
}

const PASSWORD_ITERATIONS = 100_000;

/* ------------------------------------------------------------------ */
/*  Password hashing (WebCrypto PBKDF2 — Cloudflare compatible)         */
/* ------------------------------------------------------------------ */

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function randomHex(length = 24): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomHex(16);
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: hexToBytes(salt), iterations: PASSWORD_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return `pbkdf2:${PASSWORD_ITERATIONS}:${salt}:${bytesToHex(new Uint8Array(bits))}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const parts = String(stored || '').split(':');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
    const iterations = Number(parts[1]);
    const salt = parts[2];
    const expected = parts[3];
    if (!iterations || !salt || !expected) return false;
    const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: hexToBytes(salt), iterations, hash: 'SHA-256' },
      keyMaterial,
      256
    );
    return bytesToHex(new Uint8Array(bits)) === expected;
  } catch {
    return false;
  }
}

export function randomToken(): string {
  return randomHex(32);
}

/* ------------------------------------------------------------------ */
/*  User / session helpers                                              */
/* ------------------------------------------------------------------ */

export async function clientName(db: D1Database, clientId: string): Promise<string> {
  if (!clientId) return '';
  const r = await db.prepare('SELECT companyName FROM clients WHERE id = ?').bind(clientId).first<{ companyName: string }>();
  return r ? r.companyName : '';
}

export async function publicUser(db: D1Database, u: UserRow): Promise<AuthUser> {
  const departmentIds = parseJsonList(u.departmentIds);
  return {
    id: u.id,
    clientId: u.clientId,
    username: u.username,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    departmentIds,
    clientName: await clientName(db, u.clientId),
  };
}

export async function getUserById(db: D1Database, id: string): Promise<AuthUser | null> {
  const r = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>();
  return r ? publicUser(db, r) : null;
}

export async function getSessionUser(db: D1Database, token: string): Promise<AuthUser | null> {
  if (!token) return null;
  const s = await db.prepare('SELECT userId FROM sessions WHERE token = ?').bind(token).first<{ userId: string }>();
  if (!s) return null;
  return getUserById(db, s.userId);
}

export async function currentUser(c: Context<{ Bindings: Env }>): Promise<AuthUser | null> {
  const auth = c.req.header('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  return getSessionUser(c.env.DB, auth.slice(7).trim());
}

export async function createSession(db: D1Database, userId: string): Promise<string> {
  const token = randomToken();
  await db
    .prepare('INSERT INTO sessions (token, userId, createdAt) VALUES (?, ?, ?)')
    .bind(token, userId, new Date().toISOString())
    .run();
  return token;
}

export async function deleteSession(db: D1Database, token: string) {
  await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
}
