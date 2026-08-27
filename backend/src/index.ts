import { Hono } from 'hono';

import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import type { Env } from './db.js';

import auth from './routes/auth.js';
import clients from './routes/clients.js';
import departments from './routes/departments.js';
import processes from './routes/processes.js';
import admin from './routes/admin.js';

const app =
  new Hono<{
    Bindings: Env;
  }>();

/*
|--------------------------------------------------------------------------
| Logger
|--------------------------------------------------------------------------
*/

app.use(
  '*',
  logger()
);

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

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
        Boolean
      ) as string[];

      if (!origin) {
        return (
          allowedOrigins[0] ??
          '*'
        );
      }

      if (
        allowedOrigins.includes(
          origin
        )
      ) {
        return origin;
      }

      return (
        allowedOrigins[0] ??
        '*'
      );
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

    credentials: true,
  })
);

/*
|--------------------------------------------------------------------------
| Health
|--------------------------------------------------------------------------
*/

app.get(
  '/',
  (c) => {
    return c.json({
      status: 'ok',
      message:
        'Collect API running 🚀',
    });
  }
);

app.get(
  '/health',
  async (c) => {
    try {
      const result =
        await c.env.DB
          .prepare(
            'SELECT 1 as ok'
          )
          .first<{
            ok: number;
          }>();

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
  }
);

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

app.route(
  '/',
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
| 404
|--------------------------------------------------------------------------
*/

app.notFound(
  (c) => {
    return c.json(
      {
        error:
          'Endpoint not found',
        path: c.req.path,
        method: c.req.method,
      },
      404
    );
  }
);

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

app.onError(
  (error, c) => {
    console.error(
      'Unhandled error:',
      error
    );

    return c.json(
      {
        error:
          'Internal server error',
      },
      500
    );
  }
);

export default app;