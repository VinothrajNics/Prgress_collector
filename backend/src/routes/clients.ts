import { Hono } from 'hono';

import type { Env } from '../db.js';

import {
  requireAdmin,
  requireAuth,
} from '../auth.js';

const clients =
  new Hono<{ Bindings: Env }>();

/*
|--------------------------------------------------------------------------
| GET ALL CLIENTS
|--------------------------------------------------------------------------
| Admin only
|--------------------------------------------------------------------------
*/

clients.get(
  '/',
  requireAdmin,
  async (c) => {
    try {
      const res =
        await c.env.DB
          .prepare(`
            SELECT
              id,
              name,
              email,
              username,
              created_at
            FROM clients
            ORDER BY created_at DESC
          `)
          .all();

      return c.json(
        res.results
      );
    } catch (error) {
      console.error(
        'GET /clients error:',
        error
      );

      return c.json(
        {
          error:
            'Failed to fetch clients',
        },
        500
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| GET SINGLE CLIENT
|--------------------------------------------------------------------------
|
| Admin:
|     /clients/5
|
| Client:
|     only /clients/{own-id}
|--------------------------------------------------------------------------
*/

clients.get(
  '/:id',
  requireAuth,
  async (c) => {
    const id =
      Number(
        c.req.param('id')
      );

    if (
      !Number.isInteger(id)
    ) {
      return c.json(
        {
          error:
            'Invalid client id',
        },
        400
      );
    }

    const user =
      c.get('authUser');

    if (
      user.role === 'client' &&
      user.clientId !== id
    ) {
      return c.json(
        {
          error:
            'You can only access your own client account',
        },
        403
      );
    }

    try {
      const client =
        await c.env.DB
          .prepare(`
            SELECT
              id,
              name,
              email,
              username,
              created_at
            FROM clients
            WHERE id = ?
          `)
          .bind(id)
          .first();

      if (!client) {
        return c.json(
          {
            error:
              'Client not found',
          },
          404
        );
      }

      return c.json(
        client
      );
    } catch (error) {
      console.error(
        'GET client error:',
        error
      );

      return c.json(
        {
          error:
            'Failed to fetch client',
        },
        500
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| CREATE CLIENT
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
        username?: string;
        password?: string;
      }>();

    const name =
      body.name?.trim();

    if (!name) {
      return c.json(
        {
          error:
            'name is required',
        },
        400
      );
    }

    const username =
      body.username?.trim() ||
      null;

    if (
      username &&
      username.length < 3
    ) {
      return c.json(
        {
          error:
            'Username must be at least 3 characters',
        },
        400
      );
    }

    try {
      let passwordHash:
        | string
        | null = null;

      if (body.password) {
        const {
          hashPassword,
        } = await import(
          '../auth.js'
        );

        passwordHash =
          await hashPassword(
            body.password
          );
      }

      const result =
        await c.env.DB
          .prepare(`
            INSERT INTO clients (
              name,
              email,
              username,
              password_hash
            )
            VALUES (?, ?, ?, ?)
          `)
          .bind(
            name,
            body.email?.trim() ||
              null,
            username,
            passwordHash
          )
          .run();

      const client =
        await c.env.DB
          .prepare(`
            SELECT
              id,
              name,
              email,
              username,
              created_at
            FROM clients
            WHERE id = ?
          `)
          .bind(
            result.meta.last_row_id
          )
          .first();

      return c.json(
        client,
        201
      );
    } catch (error: any) {
      console.error(
        'POST /clients error:',
        error
      );

      const message =
        String(
          error?.message ??
            ''
        ).toLowerCase();

      if (
        message.includes(
          'unique'
        ) ||
        message.includes(
          'constraint'
        )
      ) {
        return c.json(
          {
            error:
              'Username already exists',
          },
          409
        );
      }

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
| GET DEPARTMENTS FOR CLIENT
|--------------------------------------------------------------------------
|
| Admin:
| any client
|
| Client:
| only own client
|--------------------------------------------------------------------------
*/

clients.get(
  '/:id/departments',
  requireAuth,
  async (c) => {
    const clientId =
      Number(
        c.req.param('id')
      );

    if (
      !Number.isInteger(
        clientId
      )
    ) {
      return c.json(
        {
          error:
            'Invalid client id',
        },
        400
      );
    }

    const user =
      c.get('authUser');

    if (
      user.role === 'client' &&
      user.clientId !== clientId
    ) {
      return c.json(
        {
          error:
            'You can only access your own client data',
        },
        403
      );
    }

    try {
      const res =
        await c.env.DB
          .prepare(`
            SELECT
              cd.id AS client_department_id,
              d.id AS department_id,
              d.name,
              d.description,
              COUNT(p.id) AS process_count
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
          `)
          .bind(clientId)
          .all();

      return c.json(
        res.results
      );
    } catch (error) {
      console.error(
        'Client departments error:',
        error
      );

      return c.json(
        {
          error:
            'Failed to fetch departments',
        },
        500
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| ASSIGN DEPARTMENT
|--------------------------------------------------------------------------
| Admin only
|--------------------------------------------------------------------------
*/

clients.post(
  '/:id/departments',
  requireAdmin,
  async (c) => {
    const clientId =
      Number(
        c.req.param('id')
      );

    const body =
      await c.req.json<{
        department_id?: number;
      }>();

    if (
      !Number.isInteger(
        clientId
      )
    ) {
      return c.json(
        {
          error:
            'Invalid client id',
        },
        400
      );
    }

    if (
      !body.department_id ||
      !Number.isInteger(
        Number(
          body.department_id
        )
      )
    ) {
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
        await c.env.DB
          .prepare(`
            INSERT INTO client_departments (
              client_id,
              department_id
            )
            VALUES (?, ?)
          `)
          .bind(
            clientId,
            body.department_id
          )
          .run();

      return c.json(
        {
          id:
            result.meta
              .last_row_id,
          client_id:
            clientId,
          department_id:
            body.department_id,
        },
        201
      );
    } catch (error: any) {
      console.error(
        'Assign department error:',
        error
      );

      const message =
        String(
          error?.message ??
            ''
        ).toLowerCase();

      if (
        message.includes(
          'unique'
        ) ||
        message.includes(
          'constraint'
        )
      ) {
        return c.json(
          {
            error:
              'Department already assigned',
          },
          409
        );
      }

      return c.json(
        {
          error:
            'Failed to assign department',
        },
        500
      );
    }
  }
);

export default clients;