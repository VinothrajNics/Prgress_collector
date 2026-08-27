const BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001';

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export interface Client {
  id: number;
  name: string;
  email?: string;
  username?: string;
  created_at: string;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
}

export interface ClientDepartment {
  client_department_id: number;
  department_id: number;
  name: string;
  description?: string;
  process_count: number;
}

export interface Process {
  id: number;
  client_department_id: number;

  title: string;
  description?: string;

  type:
    | 'flow'
    | 'standalone';

  status:
    | 'pending'
    | 'in_progress'
    | 'done';

  flow_order?: number;
  notes?: string;

  created_at: string;
  updated_at: string;
}

export interface AdminClient
  extends Client {
  departments: ClientDepartment[];
}

export interface LoginResponse {
  token: string;
  role: 'admin' | 'client';
  username?: string;
  client?: Client;
}

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

const TOKEN_KEY =
  'process_tracker_token';

export function getToken() {
  if (
    typeof window ===
    'undefined'
  ) {
    return null;
  }

  return localStorage.getItem(
    TOKEN_KEY
  );
}

export function setToken(
  token: string
) {
  localStorage.setItem(
    TOKEN_KEY,
    token
  );
}

export function clearToken() {
  localStorage.removeItem(
    TOKEN_KEY
  );
}

/*
|--------------------------------------------------------------------------
| Request helper
|--------------------------------------------------------------------------
*/

async function req<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token =
    getToken();

  const headers: HeadersInit = {
    'Content-Type':
      'application/json',

    ...(options?.headers ?? {}),
  };

  if (token) {
    (
      headers as Record<
        string,
        string
      >
    ).Authorization =
      `Bearer ${token}`;
  }

  const res =
    await fetch(
      `${BASE}${path}`,
      {
        ...options,
        headers,
      }
    );

  if (!res.ok) {
    const err =
      await res
        .json()
        .catch(() => ({
          error:
            res.statusText,
        }));

    if (
      res.status === 401 &&
      typeof window !==
        'undefined'
    ) {
      clearToken();
    }

    throw new Error(
      (err as any).error ??
        'Request failed'
    );
  }

  return res.json();
}

/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/

export const api = {
  /*
  |--------------------------------------------------------------------------
  | Authentication
  |--------------------------------------------------------------------------
  */

  adminLogin: (
    username: string,
    password: string
  ) =>
    req<LoginResponse>(
      '/auth/admin-login',
      {
        method: 'POST',
        body: JSON.stringify({
          username,
          password,
        }),
      }
    ),

  clientLogin: (
    username: string,
    password: string
  ) =>
    req<LoginResponse>(
      '/auth/client-login',
      {
        method: 'POST',
        body: JSON.stringify({
          username,
          password,
        }),
      }
    ),

  getCurrentUser: () =>
    req<
      | {
          role: 'admin';
          username: string;
        }
      | {
          role: 'client';
          client: Client;
        }
    >('/auth/me'),

  logout: () =>
    req<{
      success: boolean;
    }>('/auth/logout', {
      method: 'POST',
    }),

  /*
  |--------------------------------------------------------------------------
  | Admin / Clients
  |--------------------------------------------------------------------------
  */

  getClients: () =>
    req<Client[]>(
      '/clients'
    ),

  createClient: (
    name: string,
    email: string | undefined,
    username: string,
    password: string
  ) =>
    req<Client>(
      '/clients',
      {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          username,
          password,
        }),
      }
    ),

  updateClientCredentials: (
    clientId: number,
    username: string,
    password?: string
  ) =>
    req<{
      success: boolean;
    }>(
      `/clients/${clientId}/credentials`,
      {
        method: 'PUT',
        body: JSON.stringify({
          username,
          password,
        }),
      }
    ),

  getClient: (
    clientId: number
  ) =>
    req<Client>(
      `/clients/${clientId}`
    ),

  /*
  |--------------------------------------------------------------------------
  | Client departments
  |--------------------------------------------------------------------------
  */

  getClientDepartments: (
    clientId: number
  ) =>
    req<ClientDepartment[]>(
      `/clients/${clientId}/departments`
    ),

  /*
  |--------------------------------------------------------------------------
  | Current logged-in client
  |--------------------------------------------------------------------------
  */

  getMyClient: () =>
    req<Client>(
      '/clients/me'
    ),

  getMyDepartments: () =>
    req<ClientDepartment[]>(
      '/clients/me/departments'
    ),

  createMyDepartment: (
    name: string,
    description?: string
  ) =>
    req<ClientDepartment>(
      '/clients/me/departments/create',
      {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
        }),
      }
    ),

  assignDepartment: (
    clientId: number,
    departmentId: number
  ) =>
    req(
      `/clients/${clientId}/departments`,
      {
        method: 'POST',
        body: JSON.stringify({
          department_id:
            departmentId,
        }),
      }
    ),

  assignMyDepartment: (
    departmentId: number
  ) =>
    req(
      '/clients/me/departments',
      {
        method: 'POST',
        body: JSON.stringify({
          department_id:
            departmentId,
        }),
      }
    ),

  /*
  |--------------------------------------------------------------------------
  | Departments
  |--------------------------------------------------------------------------
  */

  getDepartments: () =>
    req<Department[]>(
      '/departments'
    ),

  /*
  |--------------------------------------------------------------------------
  | Processes
  |--------------------------------------------------------------------------
  */

  getProcesses: (
    clientId: number,
    deptId: number
  ) =>
    req<Process[]>(
      `/clients/${clientId}/departments/${deptId}/processes`
    ),

  createProcess: (
    clientId: number,
    deptId: number,
    data: Partial<Process>
  ) =>
    req<Process>(
      `/clients/${clientId}/departments/${deptId}/processes`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  updateProcess: (
    id: number,
    data: Partial<Process>
  ) =>
    req<Process>(
      `/processes/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    ),

  deleteProcess: (
    id: number
  ) =>
    req(
      `/processes/${id}`,
      {
        method: 'DELETE',
      }
    ),

  /*
  |--------------------------------------------------------------------------
  | Admin overview
  |--------------------------------------------------------------------------
  */

  getAdminOverview: () =>
    req<AdminClient[]>(
      '/admin/overview'
    ),

  getAdminProcesses: (
    clientId: number,
    deptId: number
  ) =>
    req<Process[]>(
      `/admin/clients/${clientId}/departments/${deptId}/processes`
    ),
};