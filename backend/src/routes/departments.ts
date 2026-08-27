import { Hono } from 'hono';

import type { Env } from '../db.js';

import {
  requireAdmin,
  requireAuth,
} from '../auth.js';

const departments =
  new Hono<{ Bindings: Env }>();

/*
|--------------------------------------------------------------------------
| GET ALL DEPARTMENTS
|--------------------------------------------------------------------------
*/

departments.get(
  '/',
  requireAuth,
  async (c) => {
    try {
      const res =
        await c.env.DB
          .prepare(`
            SELECT *
            FROM departments
            ORDER BY name
          `)
          .all();

      return c.json(
        res.results
      );
    } catch (error) {
      console.error(
        'GET departments error:',
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
| CREATE DEPARTMENT
|--------------------------------------------------------------------------
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

    try {
      const result =
        await c.env.DB
          .prepare(`
            INSERT INTO departments (
              name,
              description
            )
            VALUES (?, ?)
          `)
          .bind(
            name,
            body.description?.trim() ||
              null
          )
          .run();

      const department =
        await c.env.DB
          .prepare(`
            SELECT *
            FROM departments
            WHERE id = ?
          `)
          .bind(
            result.meta.last_row_id
          )
          .first();

      return c.json(
        department,
        201
      );
    } catch (error: any) {
      console.error(
        'POST departments error:',
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
              'Department name already exists',
          },
          409
        );
      }

      return c.json(
        {
          error:
            'Failed to create department',
        },
        500
      );
    }
  }
);

export default departments;