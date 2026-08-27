import { Hono } from 'hono';
import type { Env } from '../db.js';

const processes = new Hono<{ Bindings: Env }>();

// GET processes for client + department
processes.get(
  '/clients/:clientId/departments/:deptId/processes',
  async (c) => {
    const clientId = Number(c.req.param('clientId'));
    const departmentId = Number(c.req.param('deptId'));

    if (
      !Number.isInteger(clientId) ||
      !Number.isInteger(departmentId)
    ) {
      return c.json(
        {
          error: 'Invalid client or department id',
        },
        400
      );
    }

    try {
      const result = await c.env.DB
        .prepare(`
          SELECT p.*
          FROM processes p
          JOIN client_departments cd
            ON cd.id = p.client_department_id
          WHERE cd.client_id = ?
            AND cd.department_id = ?
          ORDER BY
            CASE
              WHEN p.type = 'flow' THEN 0
              ELSE 1
            END,
            p.flow_order ASC,
            p.created_at ASC
        `)
        .bind(clientId, departmentId)
        .all();

      return c.json(result.results);
    } catch (error) {
      console.error('GET processes error:', error);

      return c.json(
        {
          error: 'Failed to fetch processes',
        },
        500
      );
    }
  }
);

// CREATE process
processes.post(
  '/clients/:clientId/departments/:deptId/processes',
  async (c) => {
    const clientId = Number(c.req.param('clientId'));
    const departmentId = Number(c.req.param('deptId'));

    const body = await c.req.json<{
      title: string;
      description?: string;
      type?: 'flow' | 'standalone';
      status?: 'pending' | 'in_progress' | 'done';
      flow_order?: number;
      notes?: string;
    }>();

    if (
      !Number.isInteger(clientId) ||
      !Number.isInteger(departmentId)
    ) {
      return c.json(
        {
          error: 'Invalid client or department id',
        },
        400
      );
    }

    const title = body.title?.trim();

    if (!title) {
      return c.json(
        {
          error: 'title is required',
        },
        400
      );
    }

    const type =
      body.type === 'flow'
        ? 'flow'
        : 'standalone';

    const status =
      body.status === 'in_progress' ||
      body.status === 'done'
        ? body.status
        : 'pending';

    try {
      const clientDepartment = await c.env.DB
        .prepare(`
          SELECT id
          FROM client_departments
          WHERE client_id = ?
            AND department_id = ?
        `)
        .bind(clientId, departmentId)
        .first<{ id: number }>();

      if (!clientDepartment) {
        return c.json(
          {
            error: 'Department is not assigned to this client',
          },
          404
        );
      }

      const result = await c.env.DB
        .prepare(`
          INSERT INTO processes (
            client_department_id,
            title,
            description,
            type,
            status,
            flow_order,
            notes
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          clientDepartment.id,
          title,
          body.description?.trim() || null,
          type,
          status,
          type === 'flow'
            ? body.flow_order ?? null
            : null,
          body.notes?.trim() || null
        )
        .run();

      const process = await c.env.DB
        .prepare(`
          SELECT *
          FROM processes
          WHERE id = ?
        `)
        .bind(result.meta.last_row_id)
        .first();

      return c.json(process, 201);
    } catch (error) {
      console.error('CREATE process error:', error);

      return c.json(
        {
          error: 'Failed to create process',
        },
        500
      );
    }
  }
);

// UPDATE process
processes.put('/processes/:id', async (c) => {
  const id = Number(c.req.param('id'));

  const body = await c.req.json<{
    title?: string;
    description?: string;
    type?: 'flow' | 'standalone';
    status?: 'pending' | 'in_progress' | 'done';
    flow_order?: number;
    notes?: string;
  }>();

  if (!Number.isInteger(id)) {
    return c.json(
      {
        error: 'Invalid process id',
      },
      400
    );
  }

  try {
    const existing = await c.env.DB
      .prepare(`
        SELECT *
        FROM processes
        WHERE id = ?
      `)
      .bind(id)
      .first();

    if (!existing) {
      return c.json(
        {
          error: 'Process not found',
        },
        404
      );
    }

    await c.env.DB
      .prepare(`
        UPDATE processes
        SET
          title = ?,
          description = ?,
          type = ?,
          status = ?,
          flow_order = ?,
          notes = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(
        body.title?.trim() || (existing as any).title,
        body.description?.trim() ||
          (existing as any).description ||
          null,
        body.type || (existing as any).type,
        body.status || (existing as any).status,
        body.type === 'standalone'
          ? null
          : body.flow_order ??
            (existing as any).flow_order ??
            null,
        body.notes?.trim() ||
          (existing as any).notes ||
          null,
        id
      )
      .run();

    const updated = await c.env.DB
      .prepare(`
        SELECT *
        FROM processes
        WHERE id = ?
      `)
      .bind(id)
      .first();

    return c.json(updated);
  } catch (error) {
    console.error('UPDATE process error:', error);

    return c.json(
      {
        error: 'Failed to update process',
      },
      500
    );
  }
});

// DELETE process
processes.delete('/processes/:id', async (c) => {
  const id = Number(c.req.param('id'));

  if (!Number.isInteger(id)) {
    return c.json(
      {
        error: 'Invalid process id',
      },
      400
    );
  }

  try {
    const result = await c.env.DB
      .prepare(`
        DELETE FROM processes
        WHERE id = ?
      `)
      .bind(id)
      .run();

    if (result.meta.changes === 0) {
      return c.json(
        {
          error: 'Process not found',
        },
        404
      );
    }

    return c.json({
      success: true,
    });
  } catch (error) {
    console.error('DELETE process error:', error);

    return c.json(
      {
        error: 'Failed to delete process',
      },
      500
    );
  }
});

export default processes;