import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { initDb } from './db.js';

import auth from './routes/auth.js';
import clients from './routes/clients.js';
import departments from './routes/departments.js';
import processes from './routes/processes.js';
import admin from './routes/admin.js';

const app = new Hono();

/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/

app.use(
  '*',
  cors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
    allowHeaders: [
      'Content-Type',
      'Authorization',
    ],
    allowMethods: [
      'GET',
      'POST',
      'PUT',
      'DELETE',
      'OPTIONS',
    ],
  })
);

app.use(
  '*',
  logger()
);

/*
|--------------------------------------------------------------------------
| Health check
|--------------------------------------------------------------------------
*/

app.get(
  '/',
  (c) =>
    c.json({
      status: 'ok',
      message:
        'Collect API running 🚀',
    })
);

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

app.route(
  '/auth',
  auth
);

app.route(
  '/clients',
  clients
);

app.route(
  '/departments',
  departments
);

app.route(
  '/',
  processes
);

app.route(
  '/admin',
  admin
);

/*
|--------------------------------------------------------------------------
| Start
|--------------------------------------------------------------------------
*/

const PORT = 3001;

initDb()
  .then(() => {
    serve(
      {
        fetch: app.fetch,
        port: PORT,
      },
      () => {
        console.log(
          `🚀 Backend running at http://localhost:${PORT}`
        );

        console.log(
          `   GET  http://localhost:${PORT}/`
        );

        console.log(
          `   POST http://localhost:${PORT}/auth/admin-login`
        );

        console.log(
          `   POST http://localhost:${PORT}/auth/client-login`
        );

        console.log(
          `   GET  http://localhost:${PORT}/admin/overview`
        );
      }
    );
  })
  .catch((err) => {
    console.error(
      '❌ Failed to initialize database:',
      err
    );

    process.exit(1);
  });