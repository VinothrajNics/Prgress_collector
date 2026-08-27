import { Hono } from 'hono';

import type { Env } from '../db.js';

import {
  createSession,
  getAuthUser,
  hashPassword,
  verifyPassword,
  deleteSession,
} from '../auth.js';

const auth =
  new Hono<{ Bindings: Env }>();

/*
|--------------------------------------------------------------------------
| Unified Login
|--------------------------------------------------------------------------
|
| Frontend can simply call:
|
| POST /login
|
| Admin:
| {
|   username: "admin",
|   password: "admin123"
| }
|
| Client:
| {
|   username: "...",
|   password: "..."
| }
|
*/

auth.post('/login', async (c) => {
  try {
    const body =
      await c.req.json<{
        username?: string;
        password?: string;
      }>();

    const username =
      body.username?.trim() ?? '';

    const password =
      body.password ?? '';

    if (!username || !password) {
      return c.json(
        {
          error:
            'Username and password are required',
        },
        400
      );
    }

    /*
    |--------------------------------------------------------------------------
    | ADMIN LOGIN
    |--------------------------------------------------------------------------
    */

    const adminUsername =
      c.env.ADMIN_USERNAME ??
      'admin';

    const adminPassword =
      c.env.ADMIN_PASSWORD ??
      'admin123';

    if (
      username === adminUsername &&
      password === adminPassword
    ) {
      const token =
        await createSession(
          c.env,
          'admin'
        );

      return c.json({
        token,
        role: 'admin',
        username: adminUsername,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | CLIENT LOGIN
    |--------------------------------------------------------------------------
    */

    const result =
      await c.env.DB
        .prepare(`
          SELECT
            id,
            name,
            email,
            username,
            password_hash,
            created_at
          FROM clients
          WHERE username = ?
          LIMIT 1
        `)
        .bind(username)
        .all();

    const client =
      result.results[0] as
        | {
            id: number;
            name: string;
            email: string | null;
            username: string;
            password_hash: string | null;
            created_at: string;
          }
        | undefined;

    if (!client) {
      return c.json(
        {
          error:
            'Invalid username or password',
        },
        401
      );
    }

    if (!client.password_hash) {
      return c.json(
        {
          error:
            'Client login has not been configured. Please contact the administrator.',
        },
        403
      );
    }

    const valid =
      await verifyPassword(
        password,
        client.password_hash
      );

    if (!valid) {
      return c.json(
        {
          error:
            'Invalid username or password',
        },
        401
      );
    }

    const token =
      await createSession(
        c.env,
        'client',
        Number(client.id)
      );

    return c.json({
      token,
      role: 'client',
      client: {
        id: Number(client.id),
        name: client.name,
        email: client.email,
        username: client.username,
        created_at:
          client.created_at,
      },
    });
  } catch (error) {
    console.error(
      'Login error:',
      error
    );

    return c.json(
      {
        error: 'Login failed',
      },
      500
    );
  }
});

/*
|--------------------------------------------------------------------------
| Admin Login
|--------------------------------------------------------------------------
*/

auth.post(
  '/admin-login',
  async (c) => {
    try {
      const body =
        await c.req.json<{
          username?: string;
          password?: string;
        }>();

      const username =
        body.username?.trim() ?? '';

      const password =
        body.password ?? '';

      const adminUsername =
        c.env.ADMIN_USERNAME ??
        'admin';

      const adminPassword =
        c.env.ADMIN_PASSWORD ??
        'admin123';

      if (
        username !==
          adminUsername ||
        password !==
          adminPassword
      ) {
        return c.json(
          {
            error:
              'Invalid admin credentials',
          },
          401
        );
      }

      const token =
        await createSession(
          c.env,
          'admin'
        );

      return c.json({
        token,
        role: 'admin',
        username:
          adminUsername,
      });
    } catch (error) {
      console.error(
        'Admin login error:',
        error
      );

      return c.json(
        {
          error:
            'Admin login failed',
        },
        500
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| Client Login
|--------------------------------------------------------------------------
*/

auth.post(
  '/client-login',
  async (c) => {
    try {
      const body =
        await c.req.json<{
          username?: string;
          password?: string;
        }>();

      const username =
        body.username?.trim() ?? '';

      const password =
        body.password ?? '';

      if (
        !username ||
        !password
      ) {
        return c.json(
          {
            error:
              'Username and password are required',
          },
          400
        );
      }

      const result =
        await c.env.DB
          .prepare(`
            SELECT
              id,
              name,
              email,
              username,
              password_hash,
              created_at
            FROM clients
            WHERE username = ?
            LIMIT 1
          `)
          .bind(username)
          .all();

      const client =
        result.results[0] as
          | {
              id: number;
              name: string;
              email: string | null;
              username: string;
              password_hash: string | null;
              created_at: string;
            }
          | undefined;

      if (!client) {
        return c.json(
          {
            error:
              'Invalid client credentials',
          },
          401
        );
      }

      if (
        !client.password_hash
      ) {
        return c.json(
          {
            error:
              'Client login has not been configured',
          },
          403
        );
      }

      const valid =
        await verifyPassword(
          password,
          client.password_hash
        );

      if (!valid) {
        return c.json(
          {
            error:
              'Invalid client credentials',
          },
          401
        );
      }

      const token =
        await createSession(
          c.env,
          'client',
          Number(client.id)
        );

      return c.json({
        token,
        role: 'client',
        client: {
          id: Number(client.id),
          name: client.name,
          email: client.email,
          username:
            client.username,
          created_at:
            client.created_at,
        },
      });
    } catch (error) {
      console.error(
        'Client login error:',
        error
      );

      return c.json(
        {
          error:
            'Client login failed',
        },
        500
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| Current User
|--------------------------------------------------------------------------
*/

auth.get('/me', async (c) => {
  try {
    const user =
      await getAuthUser(c);

    if (!user) {
      return c.json(
        {
          error:
            'Not authenticated',
        },
        401
      );
    }

    if (
      user.role === 'admin'
    ) {
      return c.json({
        role: 'admin',
        username:
          user.username,
      });
    }

    const result =
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
          LIMIT 1
        `)
        .bind(user.clientId)
        .all();

    const client =
      result.results[0];

    if (!client) {
      return c.json(
        {
          error:
            'Client not found',
        },
        404
      );
    }

    return c.json({
      role: 'client',
      client,
    });
  } catch (error) {
    console.error(
      '/me error:',
      error
    );

    return c.json(
      {
        error:
          'Failed to get current user',
      },
      500
    );
  }
});

/*
|--------------------------------------------------------------------------
| Logout
|--------------------------------------------------------------------------
*/

auth.post('/logout', async (c) => {
  try {
    const header =
      c.req.header(
        'Authorization'
      );

    if (
      header?.startsWith(
        'Bearer '
      )
    ) {
      const token =
        header
          .slice(7)
          .trim();

      if (token) {
        await deleteSession(
          c.env,
          token
        );
      }
    }

    return c.json({
      success: true,
    });
  } catch (error) {
    console.error(
      'Logout error:',
      error
    );

    return c.json(
      {
        error:
          'Logout failed',
      },
      500
    );
  }
});

/*
|--------------------------------------------------------------------------
| Password Hash Helper
|--------------------------------------------------------------------------
|
| Useful when creating/resetting client passwords.
|--------------------------------------------------------------------------
*/

export async function createClientPassword(
  password: string
) {
  return hashPassword(password);
}

export default auth;