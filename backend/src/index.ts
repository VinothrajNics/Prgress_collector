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
    origin: (origin, c) => {
      const frontendUrl =
        c.env.FRONTEND_URL;

      const allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        frontendUrl,
      ].filter(
        (value): value is string =>
          Boolean(value)
      );

      /*
        Development / server-to-server requests
      */

      if (!origin) {
        return allowedOrigins[0] ?? '*';
      }

      if (
        allowedOrigins.includes(origin)
      ) {
        return origin;
      }

      /*
        Don't allow unknown origins.
      */

      return allowedOrigins[0] ?? '';
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