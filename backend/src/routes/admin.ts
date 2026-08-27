import { Hono } from 'hono';
import type { Env } from '../db.js';

const admin = new Hono<{ Bindings: Env }>();

// GET complete admin overview
admin.get('/overview', async (c) => {
  try {
    const clientsRes = await c.env.DB
      .prepare(`
        SELECT *
        FROM clients
        ORDER BY name
      `)
      .all();

    const clients = clientsRes.results as any[];

    const result = await Promise.all(
      clients.map(async (client) => {
        const deptsRes = await c.env.DB
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
          .bind(client.id)
          .all();

        return {
          ...client,
          departments: deptsRes.results,
        };
      })
    );

    return c.json(result);
  } catch (error) {
    console.error('Admin overview error:', error);

    return c.json(
      {
        error: 'Failed to fetch admin overview',
      },
      500
    );
  }
});

// GET processes for admin
admin.get(
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
      const res = await c.env.DB
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

      return c.json(res.results);
    } catch (error) {
      console.error('Admin processes error:', error);

      return c.json(
        {
          error: 'Failed to fetch processes',
        },
        500
      );
    }
  }
);

export default admin;