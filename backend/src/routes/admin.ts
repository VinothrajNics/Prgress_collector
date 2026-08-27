import { Hono } from 'hono';
import { db } from '../db.js';
import { requireAdmin } from '../auth.js';

const admin = new Hono();

/*
|--------------------------------------------------------------------------
| Admin overview
|--------------------------------------------------------------------------
*/

admin.get(
  '/overview',
  requireAdmin,
  async (c) => {
    const clientsRes =
      await db.execute(`
        SELECT
          id,
          name,
          email,
          username,
          created_at
        FROM clients
        ORDER BY name
      `);

    const clients =
      clientsRes.rows as any[];

    const result =
      await Promise.all(
        clients.map(
          async (client) => {
            const deptsRes =
              await db.execute({
                sql: `
                  SELECT
                    cd.id
                      AS client_department_id,

                    d.id
                      AS department_id,

                    d.name,
                    d.description,

                    COUNT(p.id)
                      AS process_count

                  FROM client_departments cd

                  JOIN departments d
                    ON d.id =
                      cd.department_id

                  LEFT JOIN processes p
                    ON p.client_department_id =
                      cd.id

                  WHERE cd.client_id = ?

                  GROUP BY
                    cd.id,
                    d.id,
                    d.name,
                    d.description

                  ORDER BY d.name
                `,
                args: [
                  client.id,
                ],
              });

            return {
              ...client,
              departments:
                deptsRes.rows,
            };
          }
        )
      );

    return c.json(result);
  }
);

export default admin;