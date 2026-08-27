import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import clients from './routes/clients.js';
import departments from './routes/departments.js';
import processes from './routes/processes.js';
import admin from './routes/admin.js';

import type { Env } from './db.js';

const app = new Hono<{ Bindings: Env }>();

app.use('*', logger());

app.use(
  '*',
  cors({
    origin: (origin, c) => {
      const frontendUrl = c.env.FRONTEND_URL;

      const allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        frontendUrl,
      ].filter(Boolean);

      if (!origin) {
        return allowedOrigins[0] ?? '*';
      }

      if (allowedOrigins.includes(origin)) {
        return origin;
      }

      return allowedOrigins[0] ?? '*';
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  })
);

app.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'Collect API running 🚀',
  });
});

app.get('/health', async (c) => {
  try {
    const result = await c.env.DB
      .prepare('SELECT 1 as ok')
      .first();

    return c.json({
      status: 'ok',
      database: result?.ok === 1,
    });
  } catch (error) {
    console.error(error);

    return c.json(
      {
        status: 'error',
        database: false,
      },
      500
    );
  }
});

app.route('/clients', clients);
app.route('/departments', departments);
app.route('/', processes);
app.route('/admin', admin);

export default app;