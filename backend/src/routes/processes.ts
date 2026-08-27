import { Hono } from 'hono';
import { db } from '../db.js';
import {
  requireAdmin,
  requireClient,
} from '../auth.js';

const processes = new Hono();

/*
|--------------------------------------------------------------------------
| Helper: check that client owns client_department
|--------------------------------------------------------------------------
*/

async function getClientDepartment(
  clientId: number,
  clientDepartmentId: number
) {
  const result =
    await db.execute({
      sql: `
        SELECT
          cd.id,
          cd.client_id,
          cd.department_id
        FROM client_departments cd
        WHERE cd.id = ?
          AND cd.client_id = ?
        LIMIT 1
      `,
      args: [
        clientDepartmentId,
        clientId,
      ],
    });

  return result.rows[0] as any;
}

/*
|--------------------------------------------------------------------------
| CLIENT: Get processes
|--------------------------------------------------------------------------
*/

processes.get(
  '/clients/:clientId/departments/:deptId/processes',
  requireClient,
  async (c) => {
    const user =
      c.get('authUser') as any;

    const clientId =
      Number(
        c.req.param('clientId')
      );

    const deptId =
      Number(
        c.req.param('deptId')
      );

    if (
      clientId !==
      Number(user.clientId)
    ) {
      return c.json(
        {
          error:
            'You cannot access another client',
        },
        403
      );
    }

    const cd =
      await getClientDepartment(
        Number(user.clientId),
        deptId
      );

    if (!cd) {
      return c.json(
        {
          error:
            'Department not found',
        },
        404
      );
    }

    const res =
      await db.execute({
        sql: `
          SELECT *
          FROM processes
          WHERE client_department_id = ?
          ORDER BY
            CASE
              WHEN type = 'flow'
              THEN 0
              ELSE 1
            END,
            flow_order ASC,
            created_at ASC
        `,
        args: [deptId],
      });

    return c.json(res.rows);
  }
);

/*
|--------------------------------------------------------------------------
| CLIENT: Create process
|--------------------------------------------------------------------------
*/

processes.post(
  '/clients/:clientId/departments/:deptId/processes',
  requireClient,
  async (c) => {
    const user =
      c.get('authUser') as any;

    const clientId =
      Number(
        c.req.param('clientId')
      );

    const deptId =
      Number(
        c.req.param('deptId')
      );

    if (
      clientId !==
      Number(user.clientId)
    ) {
      return c.json(
        {
          error:
            'You cannot modify another client',
        },
        403
      );
    }

    const cd =
      await getClientDepartment(
        Number(user.clientId),
        deptId
      );

    if (!cd) {
      return c.json(
        {
          error:
            'Department not found',
        },
        404
      );
    }

    const body =
      await c.req.json<{
        title: string;
        description?: string;
        type?: 'flow' | 'standalone';
        status?:
          | 'pending'
          | 'in_progress'
          | 'done';
        flow_order?: number;
        notes?: string;
      }>();

    if (!body.title?.trim()) {
      return c.json(
        {
          error:
            'Process title is required',
        },
        400
      );
    }

    const type =
      body.type === 'flow'
        ? 'flow'
        : 'standalone';

    const status =
      body.status ??
      'pending';

    const result =
      await db.execute({
        sql: `
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
        `,
        args: [
          deptId,
          body.title.trim(),
          body.description?.trim() ||
            null,
          type,
          status,
          type === 'flow'
            ? body.flow_order ??
              null
            : null,
          body.notes?.trim() ||
            null,
        ],
      });

    const row =
      await db.execute({
        sql: `
          SELECT *
          FROM processes
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
  }
);

/*
|--------------------------------------------------------------------------
| CLIENT: Update process
|--------------------------------------------------------------------------
*/

processes.put(
  '/processes/:id',
  requireClient,
  async (c) => {
    const user =
      c.get('authUser') as any;

    const processId =
      Number(
        c.req.param('id')
      );

    const existing =
      await db.execute({
        sql: `
          SELECT
            p.*,
            cd.client_id
          FROM processes p
          JOIN client_departments cd
            ON cd.id =
              p.client_department_id
          WHERE p.id = ?
          LIMIT 1
        `,
        args: [processId],
      });

    const process =
      existing.rows[0] as any;

    if (!process) {
      return c.json(
        {
          error:
            'Process not found',
        },
        404
      );
    }

    if (
      Number(process.client_id) !==
      Number(user.clientId)
    ) {
      return c.json(
        {
          error:
            'You cannot modify another client',
        },
        403
      );
    }

    const body =
      await c.req.json<{
        title?: string;
        description?: string;
        type?: 'flow' | 'standalone';
        status?:
          | 'pending'
          | 'in_progress'
          | 'done';
        flow_order?: number;
        notes?: string;
      }>();

    const title =
      body.title !== undefined
        ? body.title.trim()
        : process.title;

    const description =
      body.description !== undefined
        ? body.description
        : process.description;

    const type =
      body.type ??
      process.type;

    const status =
      body.status ??
      process.status;

    const flowOrder =
      type === 'flow'
        ? body.flow_order ??
          process.flow_order ??
          null
        : null;

    const notes =
      body.notes !== undefined
        ? body.notes
        : process.notes;

    if (!title) {
      return c.json(
        {
          error:
            'Process title is required',
        },
        400
      );
    }

    await db.execute({
      sql: `
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
      `,
      args: [
        title,
        description || null,
        type,
        status,
        flowOrder,
        notes || null,
        processId,
      ],
    });

    const row =
      await db.execute({
        sql: `
          SELECT *
          FROM processes
          WHERE id = ?
        `,
        args: [processId],
      });

    return c.json(
      row.rows[0]
    );
  }
);

/*
|--------------------------------------------------------------------------
| CLIENT: Delete process
|--------------------------------------------------------------------------
*/

processes.delete(
  '/processes/:id',
  requireClient,
  async (c) => {
    const user =
      c.get('authUser') as any;

    const processId =
      Number(
        c.req.param('id')
      );

    const existing =
      await db.execute({
        sql: `
          SELECT
            p.id,
            cd.client_id
          FROM processes p
          JOIN client_departments cd
            ON cd.id =
              p.client_department_id
          WHERE p.id = ?
          LIMIT 1
        `,
        args: [processId],
      });

    const process =
      existing.rows[0] as any;

    if (!process) {
      return c.json(
        {
          error:
            'Process not found',
        },
        404
      );
    }

    if (
      Number(process.client_id) !==
      Number(user.clientId)
    ) {
      return c.json(
        {
          error:
            'You cannot delete another client process',
        },
        403
      );
    }

    await db.execute({
      sql: `
        DELETE FROM processes
        WHERE id = ?
      `,
      args: [processId],
    });

    return c.json({
      success: true,
    });
  }
);

/*
|--------------------------------------------------------------------------
| ADMIN: Read-only processes
|--------------------------------------------------------------------------
*/

processes.get(
  '/admin/clients/:clientId/departments/:deptId/processes',
  requireAdmin,
  async (c) => {
    const clientId =
      Number(
        c.req.param('clientId')
      );

    const departmentId =
      Number(
        c.req.param('deptId')
      );

    const cd =
      await db.execute({
        sql: `
          SELECT id
          FROM client_departments
          WHERE client_id = ?
            AND department_id = ?
          LIMIT 1
        `,
        args: [
          clientId,
          departmentId,
        ],
      });

    if (!cd.rows[0]) {
      return c.json([]);
    }

    const clientDepartmentId =
      Number(
        (cd.rows[0] as any).id
      );

    const res =
      await db.execute({
        sql: `
          SELECT *
          FROM processes
          WHERE client_department_id = ?
          ORDER BY
            CASE
              WHEN type = 'flow'
              THEN 0
              ELSE 1
            END,
            flow_order ASC,
            created_at ASC
        `,
        args: [
          clientDepartmentId,
        ],
      });

    return c.json(res.rows);
  }
);

export default processes;