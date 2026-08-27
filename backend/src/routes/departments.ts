import { Hono } from 'hono';
import { db } from '../db.js';
import { requireAdmin, requireClient } from '../auth.js';

const departments = new Hono();

/*
|--------------------------------------------------------------------------
| Get all departments
|--------------------------------------------------------------------------
|
| Admin and clients can see available department definitions.
|
*/

departments.get(
  '/',
  async (c) => {
    const res =
      await db.execute(
        `
          SELECT *
          FROM departments
          ORDER BY name
        `
      );

    return c.json(res.rows);
  }
);

/*
|--------------------------------------------------------------------------
| Admin can also create a global department
|--------------------------------------------------------------------------
|
| This is optional administrative functionality.
| Your client UI uses /clients/me/departments/create
| so the department is immediately assigned to the client.
|
*/

departments.post(
  '/',
  requireAdmin,
  async (c) => {
    const body =
      await c.req.json<{
        name: string;
        description?: string;
      }>();

    if (!body.name?.trim()) {
      return c.json(
        {
          error:
            'name is required',
        },
        400
      );
    }

    try {
      const result =
        await db.execute({
          sql: `
            INSERT INTO departments (
              name,
              description
            )
            VALUES (?, ?)
          `,
          args: [
            body.name.trim(),
            body.description?.trim() ||
              null,
          ],
        });

      const row =
        await db.execute({
          sql: `
            SELECT *
            FROM departments
            WHERE id = ?
          `,
          args: [
            result.lastInsertRowid,
          ],
        });

      return c.json(
        row.rows[0],
        201
      );
    } catch (e: any) {
      if (
        e.message?.includes('UNIQUE')
      ) {
        return c.json(
          {
            error:
              'Department name already exists',
          },
          409
        );
      }

      throw e;
    }
  }
);

export default departments;