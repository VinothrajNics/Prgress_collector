-- =========================================================
-- 0004 — Multi-company workspaces + authentication
-- ---------------------------------------------------------
-- Adds company scoping (clientId) to every workspace table,
-- the auth tables (clients / users / sessions), extended
-- report / vendor / branding columns, and preserves any rows
-- that already exist under the "ABCD & Co LLP" workspace.
-- =========================================================

-- Auth / client-company tables
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  companyName TEXT NOT NULL DEFAULT '',
  contactName TEXT NOT NULL DEFAULT '',
  contactEmail TEXT NOT NULL DEFAULT '',
  contactPhone TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active',
  createdAt TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  clientId TEXT NOT NULL DEFAULT '',
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'client',
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active',
  departmentIds TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  userId TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS client_branding (
  clientId TEXT PRIMARY KEY,
  companyName TEXT NOT NULL DEFAULT 'NICS',
  tagline TEXT NOT NULL DEFAULT '',
  consultant TEXT NOT NULL DEFAULT '',
  designation TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  navy TEXT NOT NULL DEFAULT '#1B2A5B',
  royal TEXT NOT NULL DEFAULT '#1F4E9C',
  teal TEXT NOT NULL DEFAULT '#0F7B7A',
  orange TEXT NOT NULL DEFAULT '#E8721E'
);

CREATE TABLE IF NOT EXISTS client_settings (
  clientId TEXT PRIMARY KEY,
  personalDataOptions TEXT NOT NULL DEFAULT '[]',
  mediumOptions TEXT NOT NULL DEFAULT '[]',
  departmentSeedOptions TEXT NOT NULL DEFAULT '[]',
  softwareOptions TEXT NOT NULL DEFAULT '[]',
  infoPassedOptions TEXT NOT NULL DEFAULT '[]'
);

-- Company scope column on every workspace table
ALTER TABLE groups ADD COLUMN clientId TEXT NOT NULL DEFAULT '';
ALTER TABLE entities ADD COLUMN clientId TEXT NOT NULL DEFAULT '';
ALTER TABLE departments ADD COLUMN clientId TEXT NOT NULL DEFAULT '';
ALTER TABLE processes ADD COLUMN clientId TEXT NOT NULL DEFAULT '';
ALTER TABLE activities ADD COLUMN clientId TEXT NOT NULL DEFAULT '';
ALTER TABLE datasets ADD COLUMN clientId TEXT NOT NULL DEFAULT '';
ALTER TABLE third_parties ADD COLUMN clientId TEXT NOT NULL DEFAULT '';
ALTER TABLE signoffs ADD COLUMN clientId TEXT NOT NULL DEFAULT '';

-- Report history now stores a re-viewable HTML copy
ALTER TABLE signoffs ADD COLUMN reportType TEXT NOT NULL DEFAULT '';
ALTER TABLE signoffs ADD COLUMN content TEXT NOT NULL DEFAULT '';

-- Extended third-party vendor profile
ALTER TABLE third_parties ADD COLUMN code TEXT NOT NULL DEFAULT '';
ALTER TABLE third_parties ADD COLUMN vendorStatus TEXT NOT NULL DEFAULT 'Active';
ALTER TABLE third_parties ADD COLUMN departmentCategory TEXT NOT NULL DEFAULT '';
ALTER TABLE third_parties ADD COLUMN businessOwner TEXT NOT NULL DEFAULT '';
ALTER TABLE third_parties ADD COLUMN vendorContact TEXT NOT NULL DEFAULT 'Available';
ALTER TABLE third_parties ADD COLUMN contractOwner TEXT NOT NULL DEFAULT 'Available';
ALTER TABLE third_parties ADD COLUMN processingActivity TEXT NOT NULL DEFAULT '';
ALTER TABLE third_parties ADD COLUMN purpose TEXT NOT NULL DEFAULT '';
ALTER TABLE third_parties ADD COLUMN personalDataCategories TEXT NOT NULL DEFAULT '[]';
ALTER TABLE third_parties ADD COLUMN dataPrincipals TEXT NOT NULL DEFAULT '[]';
ALTER TABLE third_parties ADD COLUMN volume TEXT NOT NULL DEFAULT '';
ALTER TABLE third_parties ADD COLUMN location TEXT NOT NULL DEFAULT '';
ALTER TABLE third_parties ADD COLUMN systems TEXT NOT NULL DEFAULT '';
ALTER TABLE third_parties ADD COLUMN subProcessors TEXT NOT NULL DEFAULT 'Do not know';

-- Extended platform branding / partner details
ALTER TABLE branding ADD COLUMN logo TEXT NOT NULL DEFAULT '';
ALTER TABLE branding ADD COLUMN partnerLogo TEXT NOT NULL DEFAULT '';
ALTER TABLE branding ADD COLUMN partnerFirm TEXT NOT NULL DEFAULT '';
ALTER TABLE branding ADD COLUMN partnerTagline TEXT NOT NULL DEFAULT '';
ALTER TABLE branding ADD COLUMN partnerContact TEXT NOT NULL DEFAULT '';
ALTER TABLE branding ADD COLUMN partnerDesignation TEXT NOT NULL DEFAULT '';
ALTER TABLE branding ADD COLUMN partnerEmail TEXT NOT NULL DEFAULT '';
ALTER TABLE branding ADD COLUMN partnerPhone TEXT NOT NULL DEFAULT '';
ALTER TABLE branding ADD COLUMN partnerAddress TEXT NOT NULL DEFAULT '';

-- Ensure a single platform branding/settings row exists
INSERT OR IGNORE INTO branding (id) VALUES (1);
INSERT OR IGNORE INTO settings (id) VALUES (1);

-- Workspace that owns all data entered before this release
INSERT OR IGNORE INTO clients (id, companyName, contactName, contactEmail, contactPhone, status, createdAt)
VALUES ('cl_abcd', 'ABCD & Co LLP', '', 'admin@demo.com', '', 'Active', '2026-09-02T00:00:00.000Z');

-- Adopt existing rows into that workspace
UPDATE groups SET clientId = 'cl_abcd' WHERE clientId = '';
UPDATE entities SET clientId = 'cl_abcd' WHERE clientId = '';
UPDATE departments SET clientId = 'cl_abcd' WHERE clientId = '';
UPDATE processes SET clientId = 'cl_abcd' WHERE clientId = '';
UPDATE activities SET clientId = 'cl_abcd' WHERE clientId = '';
UPDATE datasets SET clientId = 'cl_abcd' WHERE clientId = '';
UPDATE third_parties SET clientId = 'cl_abcd' WHERE clientId = '';
UPDATE signoffs SET clientId = 'cl_abcd' WHERE clientId = '';

-- Normalise legacy third-party profiles into the extended shape
UPDATE third_parties SET processingActivity = service WHERE trim(processingActivity) = '' AND trim(service) <> '';
UPDATE third_parties SET purpose = dataReceived WHERE trim(purpose) = '' AND trim(dataReceived) <> '';
UPDATE third_parties SET type = 'Data Processor' WHERE type = 'Processor';
UPDATE third_parties SET type = 'Joint Fiduciary' WHERE type = 'Joint Controller';
UPDATE third_parties SET type = 'Service Provider' WHERE type = 'Vendor';
UPDATE third_parties SET dpaInPlace = 'Available' WHERE dpaInPlace = 'Yes';
UPDATE third_parties SET dpaInPlace = 'Not Available' WHERE dpaInPlace = 'No';
UPDATE third_parties SET contractOwner = 'Available' WHERE contract = 'Yes';
UPDATE third_parties SET contractOwner = 'Not Available' WHERE contract = 'No';
UPDATE third_parties SET code = 'VND-' || UPPER(SUBSTR(id, 4, 6)) WHERE trim(code) = '';

-- Back-fill partner branding from the original NICS details
UPDATE branding SET partnerFirm = companyName WHERE trim(partnerFirm) = '' AND trim(companyName) <> '';
UPDATE branding SET partnerContact = consultant WHERE trim(partnerContact) = '' AND trim(consultant) <> '';
UPDATE branding SET partnerDesignation = designation WHERE trim(partnerDesignation) = '' AND trim(designation) <> '';
UPDATE branding SET partnerPhone = phone WHERE trim(partnerPhone) = '' AND trim(phone) <> '';

-- Platform admin account (password: admin123)
INSERT OR IGNORE INTO users (id, clientId, username, password, role, name, email, status, departmentIds)
VALUES ('usr_admin_1', '', 'admin', 'pbkdf2:100000:1a2b3c4d5e6f708190a0b0c0d0e0f1020:cdc61629c723dc910a575b780ed4fdb808c016d491df95b9e04ae353550af433', 'admin', 'NICS Administrator', '', 'Active', '[]');
