PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  username TEXT UNIQUE,
  password_hash TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS client_departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  department_id INTEGER NOT NULL,

  FOREIGN KEY (client_id)
    REFERENCES clients(id)
    ON DELETE CASCADE,

  FOREIGN KEY (department_id)
    REFERENCES departments(id)
    ON DELETE CASCADE,

  UNIQUE(client_id, department_id)
);

CREATE TABLE IF NOT EXISTS processes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_department_id INTEGER NOT NULL,

  title TEXT NOT NULL,
  description TEXT,

  type TEXT
    CHECK(type IN ('flow', 'standalone'))
    DEFAULT 'standalone',

  status TEXT
    CHECK(status IN ('pending', 'in_progress', 'done'))
    DEFAULT 'pending',

  flow_order INTEGER,
  notes TEXT,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (client_department_id)
    REFERENCES client_departments(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  token_hash TEXT NOT NULL UNIQUE,

  role TEXT
    CHECK(role IN ('admin', 'client'))
    NOT NULL,

  client_id INTEGER,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  expires_at DATETIME NOT NULL,

  FOREIGN KEY (client_id)
    REFERENCES clients(id)
    ON DELETE CASCADE
);
