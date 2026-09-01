import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import type { Env } from './db.js';

const app = new Hono<{
  Bindings: Env;
}>();

/* ------------------------------------------------------------------ */
/*  Middleware                                                          */
/* ------------------------------------------------------------------ */

app.use('*', logger());

app.use(
  '/api/*',
  cors({
    origin: (origin) => origin ?? '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Type'],
    credentials: true,
  })
);

/* ------------------------------------------------------------------ */
/*  Branding                                                            */
/* ------------------------------------------------------------------ */

const DEFAULT_BRANDING: Record<string, string> = {
  companyName: 'NICS',
  tagline: 'Trusted Expertise | Intelligent Solutions | Enduring Value',
  consultant: 'Vikas Jangid',
  designation: 'Internal Audit Head | DPDP Consultant',
  phone: '9632466477',
  navy: '#1B2A5B',
  royal: '#1F4E9C',
  teal: '#0F7B7A',
  orange: '#E8721E',
};

async function getBranding(db: D1Database) {
  const row = await db
    .prepare('SELECT * FROM branding WHERE id = 1')
    .first<Record<string, unknown>>();

  return { ...DEFAULT_BRANDING, ...(row || {}) };
}

async function saveBranding(db: D1Database, b: Record<string, unknown>) {
  const row = { ...DEFAULT_BRANDING, ...b };
  const cols = Object.keys(row) as string[];
  const vals = cols.map((c) => String(row[c] ?? ''));

  await db
    .prepare(
      `INSERT INTO branding (id, ${cols.join(',')})
       VALUES (1, ${cols.map(() => '?').join(',')})
       ON CONFLICT(id) DO UPDATE SET ${cols.map((c) => `${c}=excluded.${c}`).join(',')}`
    )
    .bind(...vals)
    .run();
}

/* ------------------------------------------------------------------ */
/*  Generic table helpers (async / D1)                                 */
/* ------------------------------------------------------------------ */

const ARRAY_COLUMNS: Record<string, string[]> = {
  departments: ['personalDataCollected', 'mediumOfCollection'],
  processes: ['personalInfoCollected', 'modeOfCollection', 'softwareList', 'infoPassed'],
  settings: ['personalDataOptions', 'mediumOptions', 'departmentSeedOptions', 'softwareOptions', 'infoPassedOptions'],
};

function fromRow(table: string, row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...row };
  for (const col of ARRAY_COLUMNS[table] || []) {
    try {
      out[col] = JSON.parse(String(out[col] ?? '[]'));
    } catch {
      out[col] = [];
    }
  }
  return out;
}

function toRow(table: string, obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...obj };
  for (const col of ARRAY_COLUMNS[table] || []) {
    out[col] = JSON.stringify(out[col] || []);
  }
  return out;
}

async function selectAll(db: D1Database, table: string): Promise<Record<string, unknown>[]> {
  const res = await db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all();
  return (res.results || []).map((r) => fromRow(table, r as Record<string, unknown>));
}

async function insertRow(db: D1Database, table: string, obj: Record<string, unknown>) {
  const row = toRow(table, obj);
  const cols = Object.keys(row);
  if (cols.length === 0) return;
  const vals = cols.map((c) => (row[c] === undefined || row[c] === null ? '' : String(row[c])));

  await db
    .prepare(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`)
    .bind(...vals)
    .run();
}

async function replaceTable(db: D1Database, table: string, rows: Record<string, unknown>[]) {
  await db.prepare(`DELETE FROM ${table}`).run();
  for (const r of rows || []) {
    await insertRow(db, table, r);
  }
}

/* ------------------------------------------------------------------ */
/*  Section getters / savers                                            */
/* ------------------------------------------------------------------ */

async function getOrg(db: D1Database) {
  return {
    groups: await selectAll(db, 'groups'),
    entities: await selectAll(db, 'entities'),
    departments: await selectAll(db, 'departments'),
    processes: await selectAll(db, 'processes'),
    activities: await selectAll(db, 'activities'),
  };
}

async function saveOrg(db: D1Database, o: Record<string, unknown>) {
  await replaceTable(db, 'groups', (o.groups as Record<string, unknown>[]) || []);
  await replaceTable(db, 'entities', (o.entities as Record<string, unknown>[]) || []);
  await replaceTable(db, 'departments', (o.departments as Record<string, unknown>[]) || []);
  await replaceTable(db, 'processes', (o.processes as Record<string, unknown>[]) || []);
  await replaceTable(db, 'activities', (o.activities as Record<string, unknown>[]) || []);
}

async function getInventory(db: D1Database) {
  return { datasets: await selectAll(db, 'datasets') };
}

async function saveInventory(db: D1Database, inv: Record<string, unknown>) {
  await replaceTable(db, 'datasets', (inv.datasets as Record<string, unknown>[]) || []);
}

async function getThirdParties(db: D1Database) {
  return { list: await selectAll(db, 'third_parties') };
}

async function saveThirdParties(db: D1Database, tp: Record<string, unknown>) {
  await replaceTable(db, 'third_parties', (tp.list as Record<string, unknown>[]) || []);
}

async function getSignoffs(db: D1Database) {
  return { list: await selectAll(db, 'signoffs') };
}

async function saveSignoffs(db: D1Database, s: Record<string, unknown>) {
  await replaceTable(db, 'signoffs', (s.list as Record<string, unknown>[]) || []);
}

const DEFAULT_SETTINGS: Record<string, string[]> = {
  personalDataOptions: [
    'Name',
    'Contact Details (Email/Phone)',
    'Address',
    'Government ID (PAN/Aadhaar/Passport)',
    'Financial / Bank Details',
    'Salary Information',
    'Health / Medical Data',
    'Biometric Data',
    'Employment Records',
    'Location Data',
    'Photograph / Video',
    'Educational Qualification',
    'Family Details',
  ],
  mediumOptions: ['Email', 'Messaging Application', 'Hard Copy / Physical Form', 'Website / Online Form', 'Phone Call', 'In-Person Collection'],
  departmentSeedOptions: ['Administration', 'Human Resources', 'Accounts & Finance', 'Legal', 'Company Secretaryship', 'Procurement'],
  softwareOptions: ['ERP', 'Cloud Storage', 'CRM', 'HRMS', 'Payroll Software', 'Email Server', 'Document Management System'],
  infoPassedOptions: [
    'Not Shared Externally',
    'Group / Affiliate Company',
    'Third-Party Vendor',
    'Regulatory Authority',
    'Auditor',
    'Bank / Financial Institution',
    'Government Department',
  ],
};

async function getSettings(db: D1Database) {
  const row = await db
    .prepare('SELECT * FROM settings WHERE id = 1')
    .first<Record<string, unknown>>();

  const merged = { ...DEFAULT_SETTINGS };
  if (row) {
    for (const k of Object.keys(DEFAULT_SETTINGS)) {
      try {
        const v = JSON.parse(String(row[k] ?? '[]'));
        if (Array.isArray(v)) merged[k] = v as never;
      } catch {
        /* keep default */
      }
    }
  }
  return merged;
}

async function saveSettings(db: D1Database, s: Record<string, unknown>) {
  const row = toRow('settings', { ...DEFAULT_SETTINGS, ...s });
  const cols = Object.keys(row) as string[];
  const vals = cols.map((c) => String(row[c] ?? '[]'));

  await db
    .prepare(
      `INSERT INTO settings (id, ${cols.join(',')})
       VALUES (1, ${cols.map(() => '?').join(',')})
       ON CONFLICT(id) DO UPDATE SET ${cols.map((c) => `${c}=excluded.${c}`).join(',')}`
    )
    .bind(...vals)
    .run();
}

/* ------------------------------------------------------------------ */
/*  Health                                                              */
/* ------------------------------------------------------------------ */

app.get('/', async (c) => {
  let database = false;
  try {
    const result = await c.env.DB.prepare('SELECT 1 AS ok').first<{ ok: number }>();
    database = result?.ok === 1;
  } catch {
    /* keep false */
  }

  return c.json({
    ok: true,
    service: 'NICS DPDP Data Discovery API',
    database,
  });
});

app.get('/health', async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT 1 AS ok').first<{ ok: number }>();
    return c.json({ status: 'ok', database: result?.ok === 1 });
  } catch (error) {
    console.error('Health check error:', error);
    return c.json({ status: 'error', database: false }, 500);
  }
});

/* ------------------------------------------------------------------ */
/*  State routes                                                        */
/* ------------------------------------------------------------------ */

app.get('/api/state/all', async (c) => {
  try {
    const db = c.env.DB;
    const [branding, org, inventory, thirdParties, signoffs, settings] = await Promise.all([
      getBranding(db),
      getOrg(db),
      getInventory(db),
      getThirdParties(db),
      getSignoffs(db),
      getSettings(db),
    ]);

    return c.json({ branding, org, inventory, thirdParties, signoffs, settings });
  } catch (error) {
    console.error('GET /api/state/all error:', error);
    return c.json({ error: 'Failed to load state' }, 500);
  }
});

app.get('/api/state/branding', async (c) => {
  try {
    return c.json(await getBranding(c.env.DB));
  } catch (error) {
    console.error('GET /api/state/branding error:', error);
    return c.json({ error: 'Failed to load branding' }, 500);
  }
});

app.put('/api/state/branding', async (c) => {
  try {
    await saveBranding(c.env.DB, await c.req.json());
    return c.json({ ok: true });
  } catch (error) {
    console.error('PUT /api/state/branding error:', error);
    return c.json({ error: 'Failed to save branding' }, 500);
  }
});

app.get('/api/state/org', async (c) => {
  try {
    return c.json(await getOrg(c.env.DB));
  } catch (error) {
    console.error('GET /api/state/org error:', error);
    return c.json({ error: 'Failed to load org' }, 500);
  }
});

app.put('/api/state/org', async (c) => {
  try {
    await saveOrg(c.env.DB, await c.req.json());
    return c.json({ ok: true });
  } catch (error) {
    console.error('PUT /api/state/org error:', error);
    return c.json({ error: 'Failed to save org' }, 500);
  }
});

app.get('/api/state/inventory', async (c) => {
  try {
    return c.json(await getInventory(c.env.DB));
  } catch (error) {
    console.error('GET /api/state/inventory error:', error);
    return c.json({ error: 'Failed to load inventory' }, 500);
  }
});

app.put('/api/state/inventory', async (c) => {
  try {
    await saveInventory(c.env.DB, await c.req.json());
    return c.json({ ok: true });
  } catch (error) {
    console.error('PUT /api/state/inventory error:', error);
    return c.json({ error: 'Failed to save inventory' }, 500);
  }
});

app.get('/api/state/third-parties', async (c) => {
  try {
    return c.json(await getThirdParties(c.env.DB));
  } catch (error) {
    console.error('GET /api/state/third-parties error:', error);
    return c.json({ error: 'Failed to load third parties' }, 500);
  }
});

app.put('/api/state/third-parties', async (c) => {
  try {
    await saveThirdParties(c.env.DB, await c.req.json());
    return c.json({ ok: true });
  } catch (error) {
    console.error('PUT /api/state/third-parties error:', error);
    return c.json({ error: 'Failed to save third parties' }, 500);
  }
});

app.get('/api/state/signoffs', async (c) => {
  try {
    return c.json(await getSignoffs(c.env.DB));
  } catch (error) {
    console.error('GET /api/state/signoffs error:', error);
    return c.json({ error: 'Failed to load signoffs' }, 500);
  }
});

app.put('/api/state/signoffs', async (c) => {
  try {
    await saveSignoffs(c.env.DB, await c.req.json());
    return c.json({ ok: true });
  } catch (error) {
    console.error('PUT /api/state/signoffs error:', error);
    return c.json({ error: 'Failed to save signoffs' }, 500);
  }
});

app.get('/api/state/settings', async (c) => {
  try {
    return c.json(await getSettings(c.env.DB));
  } catch (error) {
    console.error('GET /api/state/settings error:', error);
    return c.json({ error: 'Failed to load settings' }, 500);
  }
});

app.put('/api/state/settings', async (c) => {
  try {
    await saveSettings(c.env.DB, await c.req.json());
    return c.json({ ok: true });
  } catch (error) {
    console.error('PUT /api/state/settings error:', error);
    return c.json({ error: 'Failed to save settings' }, 500);
  }
});

export default app;
