import { Hono } from 'hono';
import type { Env } from '../db.js';

const clients = new Hono<{ Bindings: Env }>();

// GET all clients
clients.get('/', async (c) => {
  try {
    const res = await c.env.DB
      .prepare(`
        SELECT *
        FROM clients
        ORDER BY created_at DESC
      `)
      .all();

    return c.json(res.results);
  } catch (error) {
    console.error('GET /clients error:', error);

    return c.json(
      {
        error: 'Failed to fetch clients',
      },
      500
    );
  }
});

// GET single client
clients.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));

  if (!Number.isInteger(id)) {
    return c.json({ error: 'Invalid client id' }, 400);
  }

  try {
    const client = await c.env.DB
      .prepare(`
        SELECT *
        FROM clients
        WHERE id = ?
      `)
      .bind(id)
      .first();

    if (!client) {
      return c.json({ error: 'Client not found' }, 404);
    }

    return c.json(client);
  } catch (error) {
    console.error('GET /clients/:id error:', error);

    return c.json(
      {
        error: 'Failed to fetch client',
      },
      500
    );
  }
});

// CREATE client
clients.post('/', async (c) => {
  const body = await c.req.json<{
    name: string;
    email?: string;
  }>();

  const name = body.name?.trim();

  if (!name) {
    return c.json(
      {
        error: 'name is required',
      },
      400
    );
  }

  try {
    const result = await c.env.DB
      .prepare(`
        INSERT INTO clients (name, email)
        VALUES (?, ?)
      `)
      .bind(
        name,
        body.email?.trim() || null
      )
      .run();

    const client = await c.env.DB
      .prepare(`
        SELECT *
        FROM clients
        WHERE id = ?
      `)
      .bind(result.meta.last_row_id)
      .first();

    return c.json(client, 201);
  } catch (error) {
    console.error('POST /clients error:', error);

    return c.json(
      {
        error: 'Failed to create client',
      },
      500
    );
  }
});

// GET departments for a client
clients.get('/:id/departments', async (c) => {
  const clientId = Number(c.req.param('id'));

  if (!Number.isInteger(clientId)) {
    return c.json({ error: 'Invalid client id' }, 400);
  }

  try {
    const res = await c.env.DB
      .prepare(`
        SELECT
          cd.id AS client_department_id,
          d.id AS department_id,
          d.name,
          d.description,
          COUNT(p.id) AS process_count
        FROM client_departments cd
        JOIN departments d
          ON d.id = cd.department_id
        LEFT JOIN processes p
          ON p.client_department_id = cd.id
        WHERE cd.client_id = ?
        GROUP BY
          cd.id,
          d.id,
          d.name,
          d.description
        ORDER BY d.name
      `)
      .bind(clientId)
      .all();

    return c.json(res.results);
  } catch (error) {
    console.error('GET client departments error:', error);

    return c.json(
      {
        error: 'Failed to fetch departments',
      },
      500
    );
  }
});

// Assign department
clients.post('/:id/departments', async (c) => {
  const clientId = Number(c.req.param('id'));

  const body = await c.req.json<{
    department_id: number;
  }>();

  if (!Number.isInteger(clientId)) {
    return c.json({ error: 'Invalid client id' }, 400);
  }

  if (!body.department_id) {
    return c.json(
      {
        error: 'department_id required',
      },
      400
    );
  }

  try {
    const result = await c.env.DB
      .prepare(`
        INSERT INTO client_departments
          (client_id, department_id)
        VALUES (?, ?)
      `)
      .bind(clientId, body.department_id)
      .run();

    return c.json(
      {
        id: result.meta.last_row_id,
        client_id: clientId,
        department_id: body.department_id,
      },
      201
    );
  } catch (error: any) {
    console.error('Assign department error:', error);

    if (
      error?.message?.includes('UNIQUE') ||
      error?.message?.includes('constraint')
    ) {
      return c.json(
        {
          error: 'Department already assigned',
        },
        409
      );
    }

    return c.json(
      {
        error: 'Failed to assign department',
      },
      500
    );
  }
});

export default clients;