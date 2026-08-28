import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import auth from './routes/auth.js';
import clients from './routes/clients.js';
import departments from './routes/departments.js';
import processes from './routes/processes.js';
import admin from './routes/admin.js';

import type { Env } from './db.js';

const app = new Hono<{
  Bindings: Env;
}>();

/* =======================================================
   LOGGER
======================================================= */

app.use('*', logger());

/* =======================================================
   CORS
======================================================= */

app.use(
  '*',
  cors({
    origin: (origin) => {
      /*
        Allow any origin. Authentication relies on the
        Authorization header (bearer token), not cookies,
        so unrestricted CORS is safe here. This supports
        localhost, LAN IPs, and any deployed frontend.
      */

      return origin ?? '*';
    },

    allowMethods: [
      'GET',
      'POST',
      'PUT',
      'DELETE',
      'OPTIONS',
    ],

    allowHeaders: [
      'Content-Type',
      'Authorization',
    ],

    exposeHeaders: [
      'Content-Type',
    ],

    credentials: true,
  })
);

/* =======================================================
   HEALTH
======================================================= */

app.get('/', (c) => {
  return c.json({
    status: 'ok',
    message:
      'Collect API running 🚀',
  });
});

app.get('/health', async (c) => {
  try {
    const result =
      await c.env.DB
        .prepare(
          'SELECT 1 AS ok'
        )
        .first<{ ok: number }>();

    return c.json({
      status: 'ok',
      database:
        result?.ok === 1,
    });
  } catch (error) {
    console.error(
      'Health check error:',
      error
    );

    return c.json(
      {
        status: 'error',
        database: false,
      },
      500
    );
  }
});

/* =======================================================
   AUTHENTICATION
======================================================= */

/*
  POST /admin-login
  POST /client-login
  GET  /me
  POST /logout
*/

app.route('/', auth);

/* =======================================================
   CLIENTS
======================================================= */

app.route(
  '/clients',
  clients
);

/* =======================================================
   DEPARTMENTS
======================================================= */

app.route(
  '/departments',
  departments
);

/* =======================================================
   PROCESSES
======================================================= */

app.route(
  '/',
  processes
);

/* =======================================================
   ADMIN
======================================================= */

app.route(
  '/admin',
  admin
);

export default app;