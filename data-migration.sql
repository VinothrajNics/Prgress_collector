
PRAGMA foreign_keys = ON;

-- clients
INSERT INTO "clients" ("id", "name", "email", "username", "password_hash", "created_at") VALUES (1, 'ABC company', 'abc@mail.com', 'Client1', '3d5f7e274ed071346d6cc013d60fae32:39e9c2eb2e09cea4eba599d81ce587e3e8df8506e94c97dbcf7ae08a972def389becf5f5d25608974856e23ef0a900bcf73310163240eb2a9072a8fe0c655cb8', '2026-08-27 08:03:47');
INSERT INTO "clients" ("id", "name", "email", "username", "password_hash", "created_at") VALUES (2, 'XYZCompany', 'XYZ@mail.com', 'Client2', '2fa5b9d63e332b09e138dcee56bbe7c1:c7d077a9bb7306d65cacf064a95733815438ff3790ae5c7bb89b465c3c69492c8ce3205647cd800f50e9dcb336e2cf8a33d169859e3b2ce410b883afcb67fbf4', '2026-08-27 08:14:45');

-- departments
INSERT INTO "departments" ("id", "name", "description", "created_at") VALUES (1, 'HR Department', NULL, '2026-08-27 08:04:48');
INSERT INTO "departments" ("id", "name", "description", "created_at") VALUES (2, 'Accounts', NULL, '2026-08-27 08:05:39');
INSERT INTO "departments" ("id", "name", "description", "created_at") VALUES (3, 'tech', NULL, '2026-08-27 08:06:57');

-- client_departments
INSERT INTO "client_departments" ("id", "client_id", "department_id") VALUES (1, 1, 1);
INSERT INTO "client_departments" ("id", "client_id", "department_id") VALUES (2, 1, 2);
INSERT INTO "client_departments" ("id", "client_id", "department_id") VALUES (3, 1, 3);

-- processes
INSERT INTO "processes" ("id", "client_department_id", "title", "description", "type", "status", "flow_order", "notes", "created_at", "updated_at") VALUES (1, 1, 'Collecting of document', 'data', 'standalone', 'pending', NULL, NULL, '2026-08-27 08:05:07', '2026-08-27 08:05:07');
INSERT INTO "processes" ("id", "client_department_id", "title", "description", "type", "status", "flow_order", "notes", "created_at", "updated_at") VALUES (2, 1, 'Filtering with requirments', 'filter', 'standalone', 'pending', NULL, NULL, '2026-08-27 08:05:25', '2026-08-27 08:05:25');
INSERT INTO "processes" ("id", "client_department_id", "title", "description", "type", "status", "flow_order", "notes", "created_at", "updated_at") VALUES (3, 2, 'Gathering of transaction history', 'data', 'standalone', 'pending', NULL, NULL, '2026-08-27 08:06:04', '2026-08-27 08:06:04');
INSERT INTO "processes" ("id", "client_department_id", "title", "description", "type", "status", "flow_order", "notes", "created_at", "updated_at") VALUES (4, 2, 'Calculating the Account data', NULL, 'standalone', 'pending', NULL, NULL, '2026-08-27 08:06:22', '2026-08-27 08:06:22');
INSERT INTO "processes" ("id", "client_department_id", "title", "description", "type", "status", "flow_order", "notes", "created_at", "updated_at") VALUES (5, 3, 'step1', NULL, 'standalone', 'pending', NULL, 'step 1', '2026-08-27 08:12:26', '2026-08-27 08:12:26');

