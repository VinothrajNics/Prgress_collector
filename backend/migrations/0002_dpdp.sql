CREATE TABLE IF NOT EXISTS branding (
  id INTEGER PRIMARY KEY CHECK (id = 1),
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

CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  parentGroupId TEXT NOT NULL DEFAULT '',
  holdingPercent TEXT NOT NULL DEFAULT '',
  hqCountry TEXT NOT NULL DEFAULT '',
  dpo TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS entities (
  id TEXT PRIMARY KEY,
  groupId TEXT NOT NULL DEFAULT '',
  legalName TEXT NOT NULL DEFAULT '',
  tradingName TEXT NOT NULL DEFAULT '',
  parentEntityId TEXT NOT NULL DEFAULT '',
  holdingPercent TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  industry TEXT NOT NULL DEFAULT '',
  employeeCount TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  entityId TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  headContact TEXT NOT NULL DEFAULT '',
  headDesignation TEXT NOT NULL DEFAULT '',
  headEmail TEXT NOT NULL DEFAULT '',
  headPhone TEXT NOT NULL DEFAULT '',
  employeeCount TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  criticality TEXT NOT NULL DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'Active',
  personalDataCollected TEXT NOT NULL DEFAULT '[]',
  mediumOfCollection TEXT NOT NULL DEFAULT '[]',
  retentionYears TEXT NOT NULL DEFAULT '',
  retentionMonths TEXT NOT NULL DEFAULT '',
  deviceUsed TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS processes (
  id TEXT PRIMARY KEY,
  departmentId TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  owner TEXT NOT NULL DEFAULT '',
  ownerContact TEXT NOT NULL DEFAULT '',
  reportingTo TEXT NOT NULL DEFAULT '',
  frequency TEXT NOT NULL DEFAULT '',
  manualAutomated TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active',
  personalInfoCollected TEXT NOT NULL DEFAULT '[]',
  modeOfCollection TEXT NOT NULL DEFAULT '[]',
  retentionYears TEXT NOT NULL DEFAULT '',
  retentionMonths TEXT NOT NULL DEFAULT '',
  softwareList TEXT NOT NULL DEFAULT '[]',
  storageLocation TEXT NOT NULL DEFAULT '',
  infoPassed TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  processId TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  owner TEXT NOT NULL DEFAULT '',
  frequency TEXT NOT NULL DEFAULT '',
  manualAutomated TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS datasets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  departmentId TEXT NOT NULL DEFAULT '',
  processId TEXT NOT NULL DEFAULT '',
  personalData TEXT NOT NULL DEFAULT 'Yes',
  dataPrincipalType TEXT NOT NULL DEFAULT '',
  sensitivity TEXT NOT NULL DEFAULT 'General',
  dataElements TEXT NOT NULL DEFAULT '',
  purpose TEXT NOT NULL DEFAULT '',
  purposeDocumented TEXT NOT NULL DEFAULT 'No',
  source TEXT NOT NULL DEFAULT '',
  system TEXT NOT NULL DEFAULT '',
  storageLocation TEXT NOT NULL DEFAULT '',
  hostingCountry TEXT NOT NULL DEFAULT '',
  sharedExternally TEXT NOT NULL DEFAULT 'No',
  thirdPartyId TEXT NOT NULL DEFAULT '',
  crossBorder TEXT NOT NULL DEFAULT 'No',
  destinationCountry TEXT NOT NULL DEFAULT '',
  retentionPeriod TEXT NOT NULL DEFAULT '',
  retentionUnit TEXT NOT NULL DEFAULT 'Years',
  disposalMethod TEXT NOT NULL DEFAULT '',
  owner TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS third_parties (
  id TEXT PRIMARY KEY,
  vendor TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT '',
  service TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  dataReceived TEXT NOT NULL DEFAULT '',
  dpaInPlace TEXT NOT NULL DEFAULT 'No',
  contract TEXT NOT NULL DEFAULT 'No',
  securityAssessment TEXT NOT NULL DEFAULT 'No',
  risk TEXT NOT NULL DEFAULT 'Medium'
);

CREATE TABLE IF NOT EXISTS signoffs (
  id TEXT PRIMARY KEY,
  report TEXT NOT NULL DEFAULT '',
  generated TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Draft',
  clientName TEXT NOT NULL DEFAULT '',
  clientDesig TEXT NOT NULL DEFAULT '',
  clientEmail TEXT NOT NULL DEFAULT '',
  clientDate TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  personalDataOptions TEXT NOT NULL DEFAULT '[]',
  mediumOptions TEXT NOT NULL DEFAULT '[]',
  departmentSeedOptions TEXT NOT NULL DEFAULT '[]',
  softwareOptions TEXT NOT NULL DEFAULT '[]',
  infoPassedOptions TEXT NOT NULL DEFAULT '[]'
);
