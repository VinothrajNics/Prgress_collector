import { Hono } from 'hono';
import { db } from '../db.js';
import {
  createSession,
  getAuthUser,
  hashPassword,
  verifyPassword,
  deleteSession,
} from '../auth.js';

const auth = new Hono();

/*
|--------------------------------------------------------------------------
| Admin Login
|--------------------------------------------------------------------------
*/

auth.post('/admin-login', async (c) => {
  const body = await c.req.json<{
    username?: string;
    password?: string;
  }>();

  const username =
    body.username?.trim() ?? '';

  const password =
    body.password ?? '';

  const adminUsername =
    process.env.ADMIN_USERNAME ?? 'admin';

  const adminPassword =
    process.env.ADMIN_PASSWORD ?? 'admin123';

  if (
    username !== adminUsername ||
    password !== adminPassword
  ) {
    return c.json(
      { error: 'Invalid admin credentials' },
      401
    );
  }

  const token = await createSession(
    'admin'
  );

  return c.json({
    token,
    role: 'admin',
    username: adminUsername,
  });
});

/*
|--------------------------------------------------------------------------
| Client Login
|--------------------------------------------------------------------------
*/

auth.post('/client-login', async (c) => {
  const body = await c.req.json<{
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

  const result = await db.execute({
    sql: `
      SELECT *
      FROM clients
      WHERE username = ?
      LIMIT 1
    `,
    args: [username],
  });

  const client = result.rows[0] as any;

  if (!client) {
    return c.json(
      { error: 'Invalid client credentials' },
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

  const valid = await verifyPassword(
    password,
    client.password_hash
  );

  if (!valid) {
    return c.json(
      { error: 'Invalid client credentials' },
      401
    );
  }

  const token = await createSession(
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
      created_at: client.created_at,
    },
  });
});

/*
|--------------------------------------------------------------------------
| Current User
|--------------------------------------------------------------------------
*/

auth.get('/me', async (c) => {
  const user = await getAuthUser(c);

  if (!user) {
    return c.json(
      { error: 'Not authenticated' },
      401
    );
  }

  if (
    user.role === 'admin'
  ) {
    return c.json({
      role: 'admin',
      username: user.username,
    });
  }

  const result = await db.execute({
    sql: `
      SELECT
        id,
        name,
        email,
        username,
        created_at
      FROM clients
      WHERE id = ?
      LIMIT 1
    `,
    args: [user.clientId],
  });

  if (!result.rows[0]) {
    return c.json(
      { error: 'Client not found' },
      404
    );
  }

  return c.json({
    role: 'client',
    client: result.rows[0],
  });
});

/*
|--------------------------------------------------------------------------
| Logout
|--------------------------------------------------------------------------
*/

auth.post('/logout', async (c) => {
  const header =
    c.req.header('Authorization');

  if (header?.startsWith('Bearer ')) {
    const token = header
      .slice(7)
      .trim();

    if (token) {
      await deleteSession(token);
    }
  }

  return c.json({
    success: true,
  });
});

/*
|--------------------------------------------------------------------------
| Admin create/update client password
|--------------------------------------------------------------------------
*/

export async function createClientPassword(
  password: string
) {
  return hashPassword(password);
}

export default auth;