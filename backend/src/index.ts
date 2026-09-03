import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import type { Env } from './db-types.js';
import { DATA_TABLES, fromRow, getBranding, getSettings, insertRow, parseJsonList, placeholders, saveBranding, saveSettings, selectAll, uid, type SqlValue } from './db.js';
import type { AuthUser, Role, UserRow } from './auth.js';
import { createSession, currentUser, deleteSession, hashPassword, publicUser, verifyPassword } from './auth.js';
import { ensureSeeded } from './seed.js';

const app = new Hono<{ Bindings: Env }>();

app.use('*', logger());

app.use(
  '/api/*',
  cors({
    origin: (origin) => origin ?? '*',
    allowHeaders: ['Content-Type', 'Authorization', 'X-Client-Id'],
    allowMethods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Type'],
    credentials: true,
  })
);

/* Seed platform data (idempotent, cached per isolate) before handling API calls. */
app.use('/api/*', async (c, next) => {
  await ensureSeeded(c.env.DB);
  await next();
});

/* ------------------------------------------------------------------ */
/*  Client / company helpers                                            */
/* ------------------------------------------------------------------ */

async function clientLite(db: D1Database, clientId?: string) {
  const rows = (
    await db.prepare('SELECT id, companyName, contactName, contactEmail, contactPhone, status FROM clients').all()
  ).results as Record<string, unknown>[];
  const mapped = rows.map((r) => fromRow('clients', r) as Record<string, unknown>);
  return clientId ? mapped.filter((r) => r.id === clientId) : mapped;
}

async function clientExists(db: D1Database, id: string): Promise<boolean> {
  if (!id) return false;
  return !!(await db.prepare('SELECT 1 FROM clients WHERE id = ?').bind(id).first());
}

async function getUserRowById(db: D1Database, id: string): Promise<UserRow | undefined> {
  return (await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>()) || undefined;
}

function scopeForRead(u: AuthUser, clientIdParam: string | undefined, db: D1Database): Promise<{ all: boolean; clientId: string }> {
  return Promise.resolve().then(async () => {
    if (u.role === 'admin') {
      const raw = clientIdParam || '';
      return raw && (await clientExists(db, raw)) ? { all: false, clientId: raw } : { all: true, clientId: '' };
    }
    return { all: false, clientId: u.clientId };
  });
}

async function scopeForWrite(u: AuthUser, clientIdParam: string | undefined, db: D1Database): Promise<string | null> {
  if (u.role === 'admin') {
    const raw = clientIdParam || '';
    if (!raw || !(await clientExists(db, raw))) return null;
    return raw;
  }
  return u.clientId;
}

function deptAllowedIds(u: AuthUser): Set<string> {
  return new Set(u.role === 'department' ? u.departmentIds : []);
}

/* ------------------------------------------------------------------ */
/*  State building (role-scoped reads)                                  */
/* ------------------------------------------------------------------ */

interface StateShape {
  branding: Record<string, string>;
  org: Record<string, Record<string, unknown>[]>;
  inventory: { datasets: Record<string, unknown>[] };
  thirdParties: { list: Record<string, unknown>[] };
  signoffs: { list: Record<string, unknown>[] };
  settings: Record<string, string[]>;
  clients: Record<string, unknown>[];
}

async function buildState(db: D1Database, u: AuthUser, scope: { all: boolean; clientId: string }): Promise<StateShape> {
  const clientId = scope.all ? '' : scope.clientId;
  const allowed = deptAllowedIds(u);
  const isDept = u.role === 'department';

  let org: StateShape['org'];
  if (scope.all) {
    org = {
      groups: await selectAll(db, 'groups'),
      entities: await selectAll(db, 'entities'),
      departments: await selectAll(db, 'departments'),
      processes: await selectAll(db, 'processes'),
      activities: await selectAll(db, 'activities'),
    };
  } else if (isDept) {
    const ph = placeholders(allowed.size || 1);
    const params: SqlValue[] = [clientId, ...allowed];
    org = {
      groups: await selectAll(db, 'groups', 'WHERE clientId = ?', [clientId]),
      entities: await selectAll(db, 'entities', 'WHERE clientId = ?', [clientId]),
      departments: allowed.size ? await selectAll(db, 'departments', `WHERE clientId = ? AND id IN (${ph})`, params) : [],
      processes: allowed.size ? await selectAll(db, 'processes', `WHERE clientId = ? AND departmentId IN (${ph})`, params) : [],
      activities: allowed.size
        ? await selectAll(
            db,
            'activities',
            `WHERE clientId = ? AND processId IN (SELECT id FROM processes WHERE clientId = ? AND departmentId IN (${ph}))`,
            [clientId, clientId, ...allowed]
          )
        : [],
    };
  } else {
    org = {
      groups: await selectAll(db, 'groups', 'WHERE clientId = ?', [clientId]),
      entities: await selectAll(db, 'entities', 'WHERE clientId = ?', [clientId]),
      departments: await selectAll(db, 'departments', 'WHERE clientId = ?', [clientId]),
      processes: await selectAll(db, 'processes', 'WHERE clientId = ?', [clientId]),
      activities: await selectAll(db, 'activities', 'WHERE clientId = ?', [clientId]),
    };
  }

  let inventory: StateShape['inventory'];
  if (scope.all) {
    inventory = { datasets: await selectAll(db, 'datasets') };
  } else if (isDept) {
    inventory = allowed.size
      ? { datasets: await selectAll(db, 'datasets', `WHERE clientId = ? AND departmentId IN (${placeholders(allowed.size)})`, [clientId, ...allowed]) }
      : { datasets: [] };
  } else {
    inventory = { datasets: await selectAll(db, 'datasets', 'WHERE clientId = ?', [clientId]) };
  }

  const thirdParties = { list: scope.all ? await selectAll(db, 'third_parties') : await selectAll(db, 'third_parties', 'WHERE clientId = ?', [clientId]) };
  const signoffs = { list: scope.all ? await selectAll(db, 'signoffs') : await selectAll(db, 'signoffs', 'WHERE clientId = ?', [clientId]) };

  const branding = await getBranding(db, scope.all ? '' : clientId);
  const settings = await getSettings(db, scope.all ? '' : clientId);

  return { branding, org, inventory, thirdParties, signoffs, settings, clients: await clientLite(db, u.role === 'admin' ? undefined : clientId) };
}

/* ------------------------------------------------------------------ */
/*  Reconcile-based save (scoped, non-destructive outside the scope)    */
/* ------------------------------------------------------------------ */

interface SyncOptions {
  table: string;
  incoming: Record<string, unknown>[];
  clientId: string;
  role: Role;
  authority: boolean;
  allowed?: Set<string>;
  allowedProcesses?: Set<string>;
}

function deptRowOk(opts: SyncOptions, row: Record<string, unknown>): boolean {
  const table = opts.table;
  if (table === 'departments') return opts.allowed!.has(String(row.id));
  if (table === 'processes') return opts.allowed!.has(String(row.departmentId));
  if (table === 'activities') return opts.allowedProcesses!.has(String(row.processId));
  if (table === 'datasets') return opts.allowed!.has(String(row.departmentId));
  return true;
}

async function syncTable(db: D1Database, opts: SyncOptions) {
  const incoming = (opts.incoming || []).filter((r) => r && r.id);
  const inIds = new Set(incoming.map((r) => String(r.id)));
  const isDept = opts.role === 'department';

  if (opts.authority) {
    const existing = (await db.prepare(`SELECT * FROM ${opts.table}`).all()).results as Record<string, unknown>[];
    for (const ex of existing) {
      if (String(ex.clientId) !== opts.clientId) continue;
      if (isDept && !deptRowOk(opts, ex)) continue;
      if (inIds.has(String(ex.id))) continue;
      await db.prepare(`DELETE FROM ${opts.table} WHERE id = ?`).bind(String(ex.id)).run();
    }
  }

  for (const r of incoming) {
    if (isDept && !deptRowOk(opts, r)) continue;
    const copy = { ...r };
    copy.clientId = opts.clientId;
    await db.prepare(`DELETE FROM ${opts.table} WHERE id = ?`).bind(String(copy.id)).run();
    await insertRow(db, opts.table, copy);
  }
}

async function allowedProcessIds(db: D1Database, clientId: string, allowed: Set<string>): Promise<Set<string>> {
  if (!allowed.size) return new Set();
  const rows = (
    await db
      .prepare(`SELECT id FROM processes WHERE clientId = ? AND departmentId IN (${placeholders(allowed.size)})`)
      .bind(clientId, ...allowed)
      .all()
  ).results as { id: string }[];
  return new Set(rows.map((r) => r.id));
}

async function pruneUserDepartments(db: D1Database, clientId: string) {
  const rows = (
    await db.prepare(`SELECT id, departmentIds FROM users WHERE clientId = ? AND role = 'department'`).bind(clientId).all()
  ).results as { id: string; departmentIds: string }[];
  const existing = new Set(
    ((await db.prepare('SELECT id FROM departments WHERE clientId = ?').bind(clientId).all()).results as { id: string }[]).map((r) => r.id)
  );
  for (const r of rows) {
    const keep = parseJsonList(r.departmentIds).filter((id) => existing.has(id));
    await db.prepare('UPDATE users SET departmentIds = ? WHERE id = ?').bind(JSON.stringify(keep), r.id).run();
  }
}

async function reconcileOrg(db: D1Database, body: Record<string, unknown>, u: AuthUser, clientId: string) {
  const role = u.role;
  const isDept = role === 'department';
  const allowed = deptAllowedIds(u);

  if (!isDept) {
    await syncTable(db, { table: 'groups', incoming: (body.groups as Record<string, unknown>[]) || [], clientId, role, authority: true });
    await syncTable(db, { table: 'entities', incoming: (body.entities as Record<string, unknown>[]) || [], clientId, role, authority: true });
  }
  await syncTable(db, { table: 'departments', incoming: (body.departments as Record<string, unknown>[]) || [], clientId, role, authority: true, allowed });
  await syncTable(db, { table: 'processes', incoming: (body.processes as Record<string, unknown>[]) || [], clientId, role, authority: true, allowed });
  await syncTable(db, {
    table: 'activities',
    incoming: (body.activities as Record<string, unknown>[]) || [],
    clientId,
    role,
    authority: true,
    allowed,
    allowedProcesses: isDept ? await allowedProcessIds(db, clientId, allowed) : undefined,
  });

  if (!isDept) await pruneUserDepartments(db, clientId);
}

/* ------------------------------------------------------------------ */
/*  Health                                                              */
/* ------------------------------------------------------------------ */

app.get('/', async (c) => {
  let database = false;
  try {
    const r = await c.env.DB.prepare('SELECT 1 AS ok').first<{ ok: number }>();
    database = r?.ok === 1;
  } catch {
    /* keep false */
  }
  return c.json({ ok: true, service: 'NICS DPDP Data Discovery API', database });
});

app.get('/health', async (c) => {
  try {
    const r = await c.env.DB.prepare('SELECT 1 AS ok').first<{ ok: number }>();
    return c.json({ status: 'ok', database: r?.ok === 1 });
  } catch {
    return c.json({ status: 'error', database: false }, 500);
  }
});

/* ------------------------------------------------------------------ */
/*  Auth                                                                */
/* ------------------------------------------------------------------ */

app.post('/api/auth/login', async (c) => {
  const body = (await c.req.json()) as { username?: string; password?: string };
  const username = String(body.username || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!username || !password) return c.json({ error: 'Enter username and password' }, 400);

  const row = (await c.env.DB.prepare('SELECT * FROM users WHERE lower(username) = ?').bind(username).first<UserRow>()) || undefined;
  if (!row || row.status !== 'Active' || !(await verifyPassword(password, row.password))) {
    return c.json({ error: 'Invalid username or password' }, 401);
  }
  const token = await createSession(c.env.DB, row.id);
  return c.json({ token, user: await publicUser(c.env.DB, row) });
});

app.get('/api/auth/me', async (c) => {
  const u = await currentUser(c);
  if (!u) return c.json({ error: 'Unauthorized' }, 401);
  return c.json({ user: u });
});

app.post('/api/auth/logout', async (c) => {
  const auth = c.req.header('Authorization') || '';
  if (auth.startsWith('Bearer ')) {
    await deleteSession(c.env.DB, auth.slice(7).trim());
  }
  return c.json({ ok: true });
});

/* ------------------------------------------------------------------ */
/*  Admin: client companies                                             */
/* ------------------------------------------------------------------ */

async function countByClient(db: D1Database, table: string): Promise<Record<string, number>> {
  const rows = (await db.prepare(`SELECT clientId, COUNT(*) AS n FROM ${table} GROUP BY clientId`).all()).results as {
    clientId: string;
    n: number;
  }[];
  const map: Record<string, number> = {};
  for (const r of rows) map[r.clientId] = r.n;
  return map;
}

app.get('/api/admin/clients', async (c) => {
  const u = await currentUser(c);
  if (!u) return c.json({ error: 'Unauthorized' }, 401);
  if (u.role !== 'admin') return c.json({ error: 'Forbidden' }, 403);
  const db = c.env.DB;

  const maps: Record<string, Record<string, number>> = {};
  for (const t of DATA_TABLES) maps[t] = await countByClient(db, t);

  const clientRows = (
    await db.prepare('SELECT id, companyName, contactName, contactEmail, contactPhone, status, createdAt FROM clients ORDER BY companyName').all()
  ).results as Record<string, unknown>[];
  const userRows = (
    await db.prepare('SELECT clientId, role, COUNT(*) AS n FROM users WHERE role != ? GROUP BY clientId, role').bind('admin').all()
  ).results as { clientId: string; role: string; n: number }[];

  const list = clientRows.map((cl) => {
    const users: Record<string, number> = {};
    let totalUsers = 0;
    for (const uc of userRows.filter((x) => x.clientId === cl.id)) {
      users[uc.role] = uc.n;
      totalUsers += uc.n;
    }
    const counts: Record<string, number> = {};
    for (const t of DATA_TABLES) counts[t] = maps[t][String(cl.id)] || 0;
    return {
      id: cl.id,
      companyName: cl.companyName,
      contactName: cl.contactName,
      contactEmail: cl.contactEmail,
      contactPhone: cl.contactPhone,
      status: cl.status,
      createdAt: cl.createdAt,
      counts,
      users: totalUsers,
      clientLogins: users['client'] || 0,
      deptLogins: users['department'] || 0,
    };
  });
  return c.json({ list });
});

app.post('/api/admin/clients', async (c) => {
  const u = await currentUser(c);
  if (!u) return c.json({ error: 'Unauthorized' }, 401);
  if (u.role !== 'admin') return c.json({ error: 'Forbidden' }, 403);
  const db = c.env.DB;

  const body = (await c.req.json()) as Record<string, unknown>;
  const companyName = String(body.companyName || '').trim();
  if (!companyName) return c.json({ error: 'Company name is required' }, 400);

  const id = uid('cl');
  await db
    .prepare('INSERT INTO clients (id, companyName, contactName, contactEmail, contactPhone, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(
      id,
      companyName,
      String(body.contactName || ''),
      String(body.contactEmail || ''),
      String(body.contactPhone || ''),
      'Active',
      new Date().toISOString()
    )
    .run();

  const loginUsername = String(body.loginUsername || '').trim().toLowerCase();
  const loginPassword = String(body.loginPassword || '');
  const loginName = String(body.loginName || '').trim();
  if (loginUsername) {
    if (loginPassword.length < 4) return c.json({ error: 'Client login password must be at least 4 characters' }, 400);
    const dup = await db.prepare('SELECT 1 FROM users WHERE lower(username) = ?').bind(loginUsername).first();
    if (dup) {
      await db.prepare('DELETE FROM clients WHERE id = ?').bind(id).run();
      return c.json({ error: 'That username is already taken' }, 400);
    }
    await insertRow(db, 'users', {
      id: uid('usr'),
      clientId: id,
      username: loginUsername,
      password: await hashPassword(loginPassword),
      role: 'client',
      name: loginName || companyName + ' Admin',
      email: String(body.contactEmail || ''),
      status: 'Active',
      departmentIds: [],
    });
  }
  return c.json({ ok: true, id });
});

app.put('/api/admin/clients/:id', async (c) => {
  const u = await currentUser(c);
  if (!u) return c.json({ error: 'Unauthorized' }, 401);
  if (u.role !== 'admin') return c.json({ error: 'Forbidden' }, 403);
  const db = c.env.DB;

  const id = c.req.param('id');
  const existing = (await db.prepare('SELECT * FROM clients WHERE id = ?').bind(id).first<Record<string, unknown>>()) || undefined;
  if (!existing) return c.json({ error: 'Client not found' }, 404);
  const body = (await c.req.json()) as Record<string, unknown>;
  const companyName = String(body.companyName ?? existing.companyName).trim() || 'Unnamed Company';
  await db
    .prepare('UPDATE clients SET companyName = ?, contactName = ?, contactEmail = ?, contactPhone = ?, status = ? WHERE id = ?')
    .bind(
      companyName,
      String(body.contactName ?? existing.contactName),
      String(body.contactEmail ?? existing.contactEmail),
      String(body.contactPhone ?? existing.contactPhone),
      String(body.status ?? existing.status),
      id
    )
    .run();
  return c.json({ ok: true });
});

app.delete('/api/admin/clients/:id', async (c) => {
  const u = await currentUser(c);
  if (!u) return c.json({ error: 'Unauthorized' }, 401);
  if (u.role !== 'admin') return c.json({ error: 'Forbidden' }, 403);
  const db = c.env.DB;

  const id = c.req.param('id');
  const existing = await db.prepare('SELECT * FROM clients WHERE id = ?').bind(id).first();
  if (!existing) return c.json({ error: 'Client not found' }, 404);
  await db.prepare('DELETE FROM sessions WHERE userId IN (SELECT id FROM users WHERE clientId = ?)').bind(id).run();
  await db.prepare('DELETE FROM users WHERE clientId = ?').bind(id).run();
  for (const t of DATA_TABLES) {
    await db.prepare(`DELETE FROM ${t} WHERE clientId = ?`).bind(id).run();
  }
  await db.prepare('DELETE FROM client_branding WHERE clientId = ?').bind(id).run();
  await db.prepare('DELETE FROM client_settings WHERE clientId = ?').bind(id).run();
  await db.prepare('DELETE FROM risk_responses WHERE clientId = ?').bind(id).run();
  await db.prepare('DELETE FROM clients WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});

/* ------------------------------------------------------------------ */
/*  Users (client-scope users & logins)                                 */
/* ------------------------------------------------------------------ */

async function targetClientForUsers(u: AuthUser, clientIdParam: string | undefined, db: D1Database): Promise<string | null> {
  if (u.role === 'admin') {
    const id = clientIdParam || '';
    return id && (await clientExists(db, id)) ? id : null;
  }
  if (u.role === 'department') return null;
  return u.clientId;
}

app.get('/api/users', async (c) => {
  const u = await currentUser(c);
  if (!u) return c.json({ error: 'Unauthorized' }, 401);
  const db = c.env.DB;
  const clientId = await targetClientForUsers(u, c.req.query('clientId') || undefined, db);
  if (!clientId) return c.json({ error: 'Forbidden' }, 403);
  const rows = (
    await db
      .prepare('SELECT id, clientId, username, role, name, email, status, departmentIds FROM users WHERE clientId = ? ORDER BY username')
      .bind(clientId)
      .all()
  ).results as Record<string, unknown>[];
  return c.json({ list: rows.map((r) => fromRow('users', r)) });
});

app.post('/api/users', async (c) => {
  const u = await currentUser(c);
  if (!u) return c.json({ error: 'Unauthorized' }, 401);
  const db = c.env.DB;
  const clientId = await targetClientForUsers(u, c.req.query('clientId') || undefined, db);
  if (!clientId) return c.json({ error: 'Forbidden' }, 403);

  const body = (await c.req.json()) as {
    name?: string;
    username?: string;
    password?: string;
    role?: string;
    departmentIds?: string[];
    email?: string;
  };
  const username = String(body.username || '').trim().toLowerCase();
  const name = String(body.name || '').trim();
  const password = String(body.password || '');
  let role = String(body.role || 'department') as Role;
  if (u.role === 'client' && role !== 'department') role = 'department';
  if (role !== 'client' && role !== 'department') role = 'department';

  if (!username || !name) return c.json({ error: 'Name and username are required' }, 400);
  if (password.length < 4) return c.json({ error: 'Password must be at least 4 characters' }, 400);
  const dup = await db.prepare('SELECT 1 FROM users WHERE lower(username) = ?').bind(username).first();
  if (dup) return c.json({ error: 'That username is already taken' }, 400);

  const departmentIds = (body.departmentIds || []).filter(Boolean) as string[];
  if (role === 'department') {
    const owned = new Set(
      ((await db.prepare('SELECT id FROM departments WHERE clientId = ?').bind(clientId).all()).results as { id: string }[]).map((r) => r.id)
    );
    if (departmentIds.some((d) => !owned.has(d))) return c.json({ error: 'Assigned department is not in this company' }, 400);
  }

  const id = uid('usr');
  await insertRow(db, 'users', {
    id,
    clientId,
    username,
    password: await hashPassword(password),
    role,
    name,
    email: String(body.email || ''),
    status: 'Active',
    departmentIds,
  });
  const row = (await getUserRowById(db, id)) as unknown as UserRow;
  return c.json({ ok: true, user: await publicUser(db, row) });
});

app.put('/api/users/:id', async (c) => {
  const u = await currentUser(c);
  if (!u) return c.json({ error: 'Unauthorized' }, 401);
  const db = c.env.DB;
  const clientId = await targetClientForUsers(u, c.req.query('clientId') || undefined, db);
  if (!clientId) return c.json({ error: 'Forbidden' }, 403);

  const targetId = c.req.param('id');
  const row = await getUserRowById(db, targetId);
  if (!row || row.clientId !== clientId) return c.json({ error: 'User not found' }, 404);
  if (u.role === 'client' && (row.role !== 'department' || targetId === u.id)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const body = (await c.req.json()) as Record<string, unknown>;
  const next: Record<string, unknown> = {
    name: String(body.name ?? row.name).trim(),
    email: String(body.email ?? row.email),
    status: String(body.status ?? row.status),
  };

  let role = row.role;
  let departmentIds = parseJsonList(row.departmentIds);
  if (body.role) {
    let nr = String(body.role) as Role;
    if (u.role === 'client') nr = 'department';
    if (nr !== 'client' && nr !== 'department') nr = 'department';
    role = nr;
  }
  if (Array.isArray(body.departmentIds)) {
    departmentIds = (body.departmentIds as string[]).filter(Boolean);
    const owned = new Set(
      ((await db.prepare('SELECT id FROM departments WHERE clientId = ?').bind(clientId).all()).results as { id: string }[]).map((r) => r.id)
    );
    if (role === 'department' && departmentIds.some((d) => !owned.has(d))) {
      return c.json({ error: 'Assigned department is not in this company' }, 400);
    }
  }
  if (role === 'department' && !departmentIds.length) return c.json({ error: 'Assign at least one department' }, 400);

  if (body.password) {
    const pw = String(body.password);
    if (pw.length < 4) return c.json({ error: 'Password must be at least 4 characters' }, 400);
    next.password = await hashPassword(pw);
  }
  const params: SqlValue[] = [String(next.name), String(next.email), String(next.status), role, JSON.stringify(departmentIds)];
  let sql = 'UPDATE users SET name = ?, email = ?, status = ?, role = ?, departmentIds = ?';
  if (next.password) {
    sql += ', password = ?';
    params.push(String(next.password));
  }
  params.push(targetId);
  await db.prepare(sql + ' WHERE id = ?').bind(...params).run();
  const fresh = (await getUserRowById(db, targetId)) as unknown as UserRow;
  return c.json({ ok: true, user: await publicUser(db, fresh) });
});

app.delete('/api/users/:id', async (c) => {
  const u = await currentUser(c);
  if (!u) return c.json({ error: 'Unauthorized' }, 401);
  const db = c.env.DB;
  const clientId = await targetClientForUsers(u, c.req.query('clientId') || undefined, db);
  if (!clientId) return c.json({ error: 'Forbidden' }, 403);
  const targetId = c.req.param('id');
  const row = await getUserRowById(db, targetId);
  if (!row || row.clientId !== clientId) return c.json({ error: 'User not found' }, 404);
  if (u.role === 'client' && (row.role !== 'department' || targetId === u.id)) return c.json({ error: 'Forbidden' }, 403);
  await db.prepare('DELETE FROM sessions WHERE userId = ?').bind(targetId).run();
  await db.prepare('DELETE FROM users WHERE id = ?').bind(targetId).run();
  return c.json({ ok: true });
});

/* ------------------------------------------------------------------ */
/*  State routes (scoped read / write)                                  */
/* ------------------------------------------------------------------ */

async function resolveWrite(u: AuthUser, clientIdParam: string | undefined, db: D1Database): Promise<string | null> {
  const clientId = await scopeForWrite(u, clientIdParam, db);
  if (!clientId) return null;
  if (u.role !== 'admin' && u.clientId !== clientId) return null;
  return clientId;
}

app.get('/api/state/all', async (c) => {
  const u = await currentUser(c);
  if (!u) return c.json({ error: 'Unauthorized' }, 401);
  const scope = await scopeForRead(u, c.req.query('clientId') || undefined, c.env.DB);
  return c.json(await buildState(c.env.DB, u, scope));
});

const SECTION_READERS = {
  branding: async (db: D1Database, u: AuthUser, scope: { all: boolean; clientId: string }) => getBranding(db, scope.all ? '' : scope.clientId),
  org: async (db: D1Database, u: AuthUser, scope: { all: boolean; clientId: string }) => (await buildState(db, u, scope)).org,
  inventory: async (db: D1Database, u: AuthUser, scope: { all: boolean; clientId: string }) => (await buildState(db, u, scope)).inventory,
  'third-parties': async (db: D1Database, u: AuthUser, scope: { all: boolean; clientId: string }) => (await buildState(db, u, scope)).thirdParties,
  signoffs: async (db: D1Database, u: AuthUser, scope: { all: boolean; clientId: string }) => (await buildState(db, u, scope)).signoffs,
  settings: async (db: D1Database, u: AuthUser, scope: { all: boolean; clientId: string }) => getSettings(db, scope.all ? '' : scope.clientId),
} as const;

for (const name of Object.keys(SECTION_READERS)) {
  app.get(`/api/state/${name}`, async (c) => {
    const u = await currentUser(c);
    if (!u) return c.json({ error: 'Unauthorized' }, 401);
    const scope = await scopeForRead(u, c.req.query('clientId') || undefined, c.env.DB);
    return c.json(await SECTION_READERS[name as keyof typeof SECTION_READERS](c.env.DB, u, scope));
  });
}

app.put('/api/state/branding', async (c) => {
  const u = await currentUser(c);
  if (!u) return c.json({ error: 'Unauthorized' }, 401);
  if (u.role !== 'admin') return c.json({ error: 'Only the admin can edit branding' }, 403);
  await saveBranding(c.env.DB, await c.req.json());
  return c.json({ ok: true });
});

app.put('/api/state/settings', async (c) => {
  const u = await currentUser(c);
  if (!u) return c.json({ error: 'Unauthorized' }, 401);
  await saveSettings(c.env.DB, await c.req.json());
  return c.json({ ok: true });
});

app.put('/api/state/org', async (c) => {
  const u = await currentUser(c);
  if (!u) return c.json({ error: 'Unauthorized' }, 401);
  const clientId = await resolveWrite(u, c.req.query('clientId') || undefined, c.env.DB);
  if (!clientId) return c.json({ error: 'Select a company workspace before saving' }, 400);
  await reconcileOrg(c.env.DB, await c.req.json(), u, clientId);
  return c.json({ ok: true });
});

app.put('/api/state/inventory', async (c) => {
  const u = await currentUser(c);
  if (!u) return c.json({ error: 'Unauthorized' }, 401);
  const clientId = await resolveWrite(u, c.req.query('clientId') || undefined, c.env.DB);
  if (!clientId) return c.json({ error: 'Select a company workspace before saving' }, 400);
  const body = (await c.req.json()) as { datasets?: Record<string, unknown>[] };
  await syncTable(c.env.DB, {
    table: 'datasets',
    incoming: body.datasets || [],
    clientId,
    role: u.role,
    authority: true,
    allowed: deptAllowedIds(u),
  });
  return c.json({ ok: true });
});

app.put('/api/state/third-parties', async (c) => {
  const u = await currentUser(c);
  if (!u) return c.json({ error: 'Unauthorized' }, 401);
  const clientId = await resolveWrite(u, c.req.query('clientId') || undefined, c.env.DB);
  if (!clientId) return c.json({ error: 'Select a company workspace before saving' }, 400);
  const body = (await c.req.json()) as { list?: Record<string, unknown>[] };
  await syncTable(c.env.DB, { table: 'third_parties', incoming: body.list || [], clientId, role: u.role, authority: true });
  return c.json({ ok: true });
});

app.put('/api/state/signoffs', async (c) => {
  const u = await currentUser(c);
  if (!u) return c.json({ error: 'Unauthorized' }, 401);
  const clientId = await resolveWrite(u, c.req.query('clientId') || undefined, c.env.DB);
  if (!clientId) return c.json({ error: 'Select a company workspace before saving' }, 400);
  const body = (await c.req.json()) as { list?: Record<string, unknown>[] };
  await syncTable(c.env.DB, { table: 'signoffs', incoming: body.list || [], clientId, role: u.role, authority: true });
  return c.json({ ok: true });
});

/* ------------------------------------------------------------------ */
/*  Risk compliance questionnaire responses                             */
/* ------------------------------------------------------------------ */

async function riskScope(u: AuthUser, clientIdParam: string | undefined, db: D1Database): Promise<string | null> {
  if (u.role === 'department') return null;
  if (u.role === 'admin') {
    const raw = clientIdParam || '';
    return raw && (await clientExists(db, raw)) ? raw : null;
  }
  return u.clientId || null;
}

app.get('/api/risk/responses', async (c) => {
  const u = await currentUser(c);
  if (!u) return c.json({ error: 'Unauthorized' }, 401);
  const clientId = await riskScope(u, c.req.query('clientId') || undefined, c.env.DB);
  if (!clientId) return c.json({ error: 'Select a company workspace' }, 400);
  const rows = (
    await c.env.DB.prepare('SELECT questionId, answer, updatedAt FROM risk_responses WHERE clientId = ?').bind(clientId).all()
  ).results as { questionId: string; answer: string; updatedAt: string }[];
  return c.json({ list: rows });
});

app.put('/api/risk/responses', async (c) => {
  const u = await currentUser(c);
  if (!u) return c.json({ error: 'Unauthorized' }, 401);
  const clientId = await riskScope(u, c.req.query('clientId') || undefined, c.env.DB);
  if (!clientId) return c.json({ error: 'Select a company workspace' }, 400);
  const body = (await c.req.json()) as { answers?: Record<string, string> };
  const answers = body.answers || {};
  const now = new Date().toISOString();
  await c.env.DB.prepare('DELETE FROM risk_responses WHERE clientId = ?').bind(clientId).run();
  for (const [qid, answer] of Object.entries(answers)) {
    if (answer === undefined || answer === null || answer === '') continue;
    await c.env.DB
      .prepare('INSERT INTO risk_responses (clientId, questionId, answer, updatedAt) VALUES (?, ?, ?, ?)')
      .bind(clientId, qid, String(answer), now)
      .run();
  }
  return c.json({ ok: true });
});

export default app;
