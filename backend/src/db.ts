import type { Env } from './db-types.js';

export type { Env };
export type { AppBindings } from './db-types.js';

/* ------------------------------------------------------------------ */
/*  Tables that store per-company workspace data                        */
/* ------------------------------------------------------------------ */

export const DATA_TABLES = [
  'groups',
  'entities',
  'departments',
  'processes',
  'activities',
  'datasets',
  'third_parties',
  'signoffs',
] as const;

/* Columns stored as JSON-encoded arrays */
const ARRAY_COLUMNS: Record<string, string[]> = {
  departments: ['personalDataCollected', 'mediumOfCollection'],
  processes: ['personalInfoCollected', 'modeOfCollection', 'softwareList', 'infoPassed'],
  third_parties: ['personalDataCategories', 'dataPrincipals'],
  users: ['departmentIds'],
  settings: ['personalDataOptions', 'mediumOptions', 'departmentSeedOptions', 'softwareOptions', 'infoPassedOptions'],
  client_settings: ['personalDataOptions', 'mediumOptions', 'departmentSeedOptions', 'softwareOptions', 'infoPassedOptions'],
};

export function fromRow(table: string, row: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!row) return row;
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

export function toRow(table: string, obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...obj };
  for (const col of ARRAY_COLUMNS[table] || []) {
    out[col] = JSON.stringify(out[col] || []);
  }
  return out;
}

export function parseJsonList(value: unknown): string[] {
  try {
    const v = JSON.parse(String(value ?? '[]'));
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export function uid(p: string): string {
  return p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export type SqlValue = string | number | bigint | Uint8Array | null;

export function placeholders(n: number): string {
  return Array.from({ length: n }, () => '?').join(',');
}

export async function selectAll(db: D1Database, table: string, where = '', params: SqlValue[] = []): Promise<Record<string, unknown>[]> {
  const res = await db.prepare(`SELECT * FROM ${table} ${where} ORDER BY rowid`).bind(...params).all();
  return (res.results || []).map((r) => fromRow(table, r as Record<string, unknown>) as Record<string, unknown>);
}

export async function insertRow(db: D1Database, table: string, obj: Record<string, unknown>) {
  const row = toRow(table, obj);
  const cols = Object.keys(row);
  if (cols.length === 0) return;
  const vals = cols.map((c) => (row[c] === undefined || row[c] === null ? '' : String(row[c])));
  await db.prepare(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`).bind(...vals).run();
}

/* ------------------------------------------------------------------ */
/*  Platform defaults                                                   */
/* ------------------------------------------------------------------ */

export const DEFAULT_BRANDING: Record<string, string> = {
  companyName: 'NICS',
  tagline: 'Trusted Expertise | Intelligent Solutions | Enduring Value',
  consultant: 'Vikas Jangid',
  designation: 'Internal Audit Head | DPDP Consultant',
  phone: '9632466477',
  navy: '#1B2A5B',
  royal: '#1F4E9C',
  teal: '#0F7B7A',
  orange: '#E8721E',
  logo: '',
  partnerLogo: '',
  partnerFirm: '',
  partnerTagline: '',
  partnerContact: '',
  partnerDesignation: '',
  partnerEmail: '',
  partnerPhone: '',
  partnerAddress: '',
};

export const DEFAULT_SETTINGS: Record<string, string[]> = {
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

export async function getBranding(db: D1Database, _clientId?: string | null) {
  const base: Record<string, string> = { ...DEFAULT_BRANDING };
  try {
    const row = await db.prepare('SELECT * FROM branding WHERE id = 1').first<Record<string, unknown>>();
    if (row) Object.assign(base, row);
  } catch {
    /* table not created yet */
  }
  return base;
}

export async function getSettings(db: D1Database, _clientId?: string | null) {
  const base: Record<string, string[]> = {};
  for (const k of Object.keys(DEFAULT_SETTINGS)) base[k] = [...DEFAULT_SETTINGS[k]];
  try {
    const row = await db.prepare('SELECT * FROM settings WHERE id = 1').first<Record<string, unknown>>();
    if (row) {
      for (const k of Object.keys(DEFAULT_SETTINGS)) {
        const arr = parseJsonList(row[k]);
        if (arr.length) base[k] = arr;
      }
    }
  } catch {
    /* table not created yet */
  }
  return base;
}

export async function saveBranding(db: D1Database, b: Record<string, unknown>) {
  const row = { ...DEFAULT_BRANDING, ...b };
  const cols = Object.keys(row);
  await db
    .prepare(
      `INSERT INTO branding (id, ${cols.join(',')})
       VALUES (1, ${cols.map((_, i) => '?' + (i + 1)).join(',')})
       ON CONFLICT(id) DO UPDATE SET ${cols.map((c) => `${c}=excluded.${c}`).join(',')}`
    )
    .bind(...cols.map((c) => String(row[c] ?? '')))
    .run();
}

export async function saveSettings(db: D1Database, s: Record<string, unknown>) {
  const row = toRow('settings', { ...DEFAULT_SETTINGS, ...s });
  const cols = Object.keys(row);
  await db
    .prepare(
      `INSERT INTO settings (id, ${cols.join(',')})
       VALUES (1, ${cols.map((_, i) => '?' + (i + 1)).join(',')})
       ON CONFLICT(id) DO UPDATE SET ${cols.map((c) => `${c}=excluded.${c}`).join(',')}`
    )
    .bind(...cols.map((c) => String(row[c] ?? '[]')))
    .run();
}
