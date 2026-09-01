DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS processes;
DROP TABLE IF EXISTS client_departments;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS clients;

CREATE TABLE departments (
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

CREATE TABLE processes (
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
