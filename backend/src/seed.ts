import type { Env } from './db-types.js';
import { DATA_TABLES, DEFAULT_BRANDING, DEFAULT_SETTINGS, insertRow, saveBranding, saveSettings, uid } from './db.js';
import { hashPassword } from './auth.js';

let seedPromise: Promise<void> | null = null;

async function rowExists(db: D1Database, table: string): Promise<boolean> {
  const r = await db
    .prepare(`SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name=?`)
    .bind(table)
    .first<{ n: number }>();
  return !!r && r.n > 0;
}

async function legacyRow(db: D1Database, table: string): Promise<Record<string, unknown> | undefined> {
  if (!(await rowExists(db, table))) return undefined;
  try {
    return (await db.prepare(`SELECT * FROM ${table} WHERE id = 1`).first()) as Record<string, unknown> | undefined;
  } catch {
    return undefined;
  }
}

async function insertUser(
  db: D1Database,
  u: { id: string; clientId: string; username: string; password: string; role: string; name: string; email?: string; departmentIds?: string[] }
) {
  await db
    .prepare(
      `INSERT OR IGNORE INTO users (id, clientId, username, password, role, name, email, status, departmentIds)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Active', ?)`
    )
    .bind(u.id, u.clientId, u.username, u.password, u.role, u.name, u.email || '', JSON.stringify(u.departmentIds || []))
    .run();
}

/*
  First-boot seeding. Mirrors the local app's migrateAndSeed for a schema
  that is already created by D1 migrations:
    - platform branding / settings rows
    - the platform admin account (admin / admin123)
    - a demo company if no client exists yet (adopts any un-owned rows)
  Idempotent: safe to run on every worker boot.
*/
async function runSeed(db: D1Database) {
  if (!(await rowExists(db, 'branding'))) return;

  if (!(await legacyRow(db, 'branding'))) {
    await saveBranding(db, { ...DEFAULT_BRANDING });
  }
  if (!(await legacyRow(db, 'settings'))) {
    await saveSettings(db, { ...DEFAULT_SETTINGS });
  }

  const admin = await db.prepare(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`).first<{ id: string }>();
  if (!admin) {
    await insertUser(db, { id: uid('usr'), clientId: '', username: 'admin', password: await hashPassword('admin123'), role: 'admin', name: 'NICS Administrator' });
  }

  let first = await db.prepare(`SELECT * FROM clients ORDER BY createdAt, rowid LIMIT 1`).first<Record<string, unknown>>();
  if (!first) {
    const demoId = uid('cl');
    const legacyBrand = await legacyRow(db, 'branding');
    await db
      .prepare(
        `INSERT OR IGNORE INTO clients (id, companyName, contactName, contactEmail, contactPhone, status, createdAt)
         VALUES (?, ?, '', 'admin@demo.com', '', 'Active', ?)`
      )
      .bind(demoId, String((legacyBrand as Record<string, unknown> | undefined)?.companyName || 'Sample Manufacturing Pvt Ltd'), new Date().toISOString())
      .run();

    for (const t of DATA_TABLES) {
      await db.prepare(`UPDATE ${t} SET clientId = ? WHERE clientId = ''`).bind(demoId).run();
    }

    const clientUser = await db.prepare(`SELECT id FROM users WHERE username = ?`).bind('admin@demo.com').first<{ id: string }>();
    if (!clientUser) {
      const brand = await legacyRow(db, 'branding');
      await insertUser(db, {
        id: uid('usr'),
        clientId: demoId,
        username: 'admin@demo.com',
        password: await hashPassword('client123'),
        role: 'client',
        name: String((brand as Record<string, unknown> | undefined)?.companyName || 'Sample Manufacturing Pvt Ltd') + ' Admin',
      });
    }
    first = ((await db.prepare(`SELECT * FROM clients WHERE id = ?`).bind(demoId).first()) as Record<string, unknown> | undefined) || null;
  }

  if (first) {
    const owner = String((first as Record<string, unknown>).id);
    for (const t of DATA_TABLES) {
      await db.prepare(`UPDATE ${t} SET clientId = ? WHERE clientId = ''`).bind(owner).run();
    }
  }

  await db.prepare(`DELETE FROM sessions WHERE julianday(createdAt) < julianday('now', '-30 days')`).run();
}

export function ensureSeeded(db: D1Database): Promise<void> {
  if (!seedPromise) {
    seedPromise = runSeed(db).catch((e) => {
      seedPromise = null;
      throw e;
    });
  }
  return seedPromise;
}
