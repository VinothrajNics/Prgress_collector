
PRAGMA foreign_keys = ON;

-- clients
INSERT INTO "clients" ("id", "name", "email", "username", "password_hash", "created_at") VALUES (1, 'ABC company', 'abc@mail.com', 'Client1', 'pbkdf2:100000:69a283a6f669567ad91a82d6489e96bf:94294a67af255666b13a1efa353fa7fff26aaf1ef9e3a8e6836abe5402c05d5b', '2026-08-27 08:03:47');
INSERT INTO "clients" ("id", "name", "email", "username", "password_hash", "created_at") VALUES (2, 'XYZCompany', 'XYZ@mail.com', 'Client2', 'pbkdf2:100000:81215aa3b936d742beff2a74f659ba20:a9ad7d53ab2ee26a0492b8f615fc63002ac9a672fe9d21589752d753a8032724', '2026-08-27 08:14:45');

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

