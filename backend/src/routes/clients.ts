import { Hono } from 'hono';
import { db } from '../db.js';
import {
  requireAdmin,
  requireClient,
  hashPassword,
} from '../auth.js';

const clients = new Hono();

/*
|--------------------------------------------------------------------------
| ADMIN: Get all clients
|--------------------------------------------------------------------------
*/

clients.get(
  '/',
  requireAdmin,
  async (c) => {
    const res = await db.execute(
      `
        SELECT
          id,
          name,
          email,
          username,
          created_at
        FROM clients
        ORDER BY created_at DESC
      `
    );

    return c.json(res.rows);
  }
);

/*
|--------------------------------------------------------------------------
| ADMIN: Create client
|--------------------------------------------------------------------------
*/

clients.post(
  '/',
  requireAdmin,
  async (c) => {
    const body =
      await c.req.json<{
        name: string;
        email?: string;
        username: string;
        password: string;
      }>();

    if (!body.name?.trim()) {
      return c.json(
        { error: 'name is required' },
        400
      );
    }

    if (!body.username?.trim()) {
      return c.json(
        { error: 'username is required' },
        400
      );
    }

    if (!body.password) {
      return c.json(
        { error: 'password is required' },
        400
      );
    }

    if (body.password.length < 6) {
      return c.json(
        {
          error:
            'Password must be at least 6 characters',
        },
        400
      );
    }

    const passwordHash =
      await hashPassword(body.password);

    try {
      const result =
        await db.execute({
          sql: `
            INSERT INTO clients (
              name,
              email,
              username,
              password_hash
            )
            VALUES (?, ?, ?, ?)
          `,
          args: [
            body.name.trim(),
            body.email?.trim() || null,
            body.username.trim(),
            passwordHash,
          ],
        });

      const row =
        await db.execute({
          sql: `
            SELECT
              id,
              name,
              email,
              username,
              created_at
            FROM clients
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
              'Username already exists',
          },
          409
        );
      }

      console.error(e);

      return c.json(
        {
          error:
            'Failed to create client',
        },
        500
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| ADMIN: Update client login credentials
|--------------------------------------------------------------------------
*/

clients.put(
  '/:id/credentials',
  requireAdmin,
  async (c) => {
    const clientId =
      Number(c.req.param('id'));

    const body =
      await c.req.json<{
        username: string;
        password?: string;
      }>();

    if (!body.username?.trim()) {
      return c.json(
        {
          error:
            'Username is required',
        },
        400
      );
    }

    try {
      if (body.password) {
        if (body.password.length < 6) {
          return c.json(
            {
              error:
                'Password must be at least 6 characters',
            },
            400
          );
        }

        const passwordHash =
          await hashPassword(
            body.password
          );

        await db.execute({
          sql: `
            UPDATE clients
            SET
              username = ?,
              password_hash = ?
            WHERE id = ?
          `,
          args: [
            body.username.trim(),
            passwordHash,
            clientId,
          ],
        });
      } else {
        await db.execute({
          sql: `
            UPDATE clients
            SET username = ?
            WHERE id = ?
          `,
          args: [
            body.username.trim(),
            clientId,
          ],
        });
      }

      return c.json({
        success: true,
      });
    } catch (e: any) {
      if (
        e.message?.includes('UNIQUE')
      ) {
        return c.json(
          {
            error:
              'Username already exists',
          },
          409
        );
      }

      throw e;
    }
  }
);

/*
|--------------------------------------------------------------------------
| CLIENT: Current logged-in client
|--------------------------------------------------------------------------
*/

clients.get(
  '/me',
  requireClient,
  async (c) => {
    const user =
      c.get('authUser') as any;

    const result =
      await db.execute({
        sql: `
          SELECT
            id,
            name,
            email,
            username,
            created_at
          FROM clients
          WHERE id = ?
        `,
        args: [
          user.clientId,
        ],
      });

    if (!result.rows[0]) {
      return c.json(
        {
          error:
            'Client not found',
        },
        404
      );
    }

    return c.json(
      result.rows[0]
    );
  }
);

/*
|--------------------------------------------------------------------------
| CLIENT: Current client's departments
|--------------------------------------------------------------------------
*/

clients.get(
  '/me/departments',
  requireClient,
  async (c) => {
    const user =
      c.get('authUser') as any;

    const res =
      await db.execute({
        sql: `
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
        `,
        args: [
          user.clientId,
        ],
      });

    return c.json(res.rows);
  }
);

/*
|--------------------------------------------------------------------------
| ADMIN: Get one client
|--------------------------------------------------------------------------
*/

clients.get(
  '/:id',
  requireAdmin,
  async (c) => {
    const result =
      await db.execute({
        sql: `
          SELECT
            id,
            name,
            email,
            username,
            created_at
          FROM clients
          WHERE id = ?
        `,
        args: [
          c.req.param('id'),
        ],
      });

    if (!result.rows[0]) {
      return c.json(
        { error: 'Not found' },
        404
      );
    }

    return c.json(
      result.rows[0]
    );
  }
);

/*
|--------------------------------------------------------------------------
| ADMIN: Get departments for a client
|--------------------------------------------------------------------------
*/

clients.get(
  '/:id/departments',
  requireAdmin,
  async (c) => {
    const res =
      await db.execute({
        sql: `
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
        `,
        args: [
          c.req.param('id'),
        ],
      });

    return c.json(res.rows);
  }
);

/*
|--------------------------------------------------------------------------
| CLIENT: Create a NEW department and assign it
|--------------------------------------------------------------------------
*/

clients.post(
  '/me/departments/create',
  requireClient,
  async (c) => {
    const user =
      c.get('authUser') as any;

    const body =
      await c.req.json<{
        name: string;
        description?: string;
      }>();

    if (!body.name?.trim()) {
      return c.json(
        {
          error:
            'Department name is required',
        },
        400
      );
    }

    try {
      const deptResult =
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

      const departmentId =
        Number(
          deptResult.lastInsertRowid
        );

      const assignResult =
        await db.execute({
          sql: `
            INSERT INTO client_departments (
              client_id,
              department_id
            )
            VALUES (?, ?)
          `,
          args: [
            user.clientId,
            departmentId,
          ],
        });

      return c.json(
        {
          client_department_id:
            Number(
              assignResult.lastInsertRowid
            ),
          department_id:
            departmentId,
          name: body.name.trim(),
          description:
            body.description?.trim() ||
            null,
          process_count: 0,
        },
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

/*
|--------------------------------------------------------------------------
| CLIENT: Assign existing department
|--------------------------------------------------------------------------
*/

clients.post(
  '/me/departments',
  requireClient,
  async (c) => {
    const user =
      c.get('authUser') as any;

    const body =
      await c.req.json<{
        department_id: number;
      }>();

    if (!body.department_id) {
      return c.json(
        {
          error:
            'department_id required',
        },
        400
      );
    }

    try {
      const result =
        await db.execute({
          sql: `
            INSERT INTO client_departments (
              client_id,
              department_id
            )
            VALUES (?, ?)
          `,
          args: [
            user.clientId,
            body.department_id,
          ],
        });

      return c.json(
        {
          id: Number(
            result.lastInsertRowid
          ),
          client_id:
            user.clientId,
          department_id:
            body.department_id,
        },
        201
      );
    } catch (e: any) {
      if (
        e.message?.includes('UNIQUE')
      ) {
        return c.json(
          {
            error:
              'Department already assigned',
          },
          409
        );
      }

      throw e;
    }
  }
);

export default clients;