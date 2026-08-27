const BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:8787';

async function req<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({
        error: res.statusText,
      }));

    throw new Error(
      (err as any).error ?? 'Request failed'
    );
  }

  return res.json();
}

export interface Client {
  id: number;
  name: string;
  email?: string;
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

  type: 'flow' | 'standalone';

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

export const api = {
  // --------------------------------------------------
  // CLIENTS
  // --------------------------------------------------

  getClients: () =>
    req<Client[]>('/clients'),

  getClient: (id: number) =>
    req<Client>(`/clients/${id}`),

  createClient: (
    name: string,
    email?: string
  ) =>
    req<Client>('/clients', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
      }),
    }),

  // --------------------------------------------------
  // CLIENT DEPARTMENTS
  // --------------------------------------------------

  getClientDepartments: (
    clientId: number
  ) =>
    req<ClientDepartment[]>(
      `/clients/${clientId}/departments`
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
          department_id: departmentId,
        }),
      }
    ),

  // --------------------------------------------------
  // DEPARTMENTS
  // --------------------------------------------------

  getDepartments: () =>
    req<Department[]>('/departments'),

  createDepartment: (
    name: string,
    description?: string
  ) =>
    req<Department>('/departments', {
      method: 'POST',
      body: JSON.stringify({
        name,
        description,
      }),
    }),

  // --------------------------------------------------
  // PROCESSES
  // --------------------------------------------------

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

  deleteProcess: (id: number) =>
    req(
      `/processes/${id}`,
      {
        method: 'DELETE',
      }
    ),

  // --------------------------------------------------
  // ADMIN
  // --------------------------------------------------

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