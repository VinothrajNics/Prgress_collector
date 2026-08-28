const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://collect-api.collect-process-api.workers.dev";

export interface Client {
  id: number;
  name: string;
  email: string | null;
  username: string;
  created_at: string;
}

export interface LoginResponse {
  token: string;
  role: "admin" | "client";
  username?: string;
  client?: Client;
}

export interface MeResponse {
  role: "admin" | "client";
  username?: string;
  client?: Client;
}

export interface Department {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface ClientDepartment {
  client_department_id: number;
  department_id: number;
  name: string;
  description: string | null;
  process_count: number;
}

export interface AdminClient extends Client {
  departments: ClientDepartment[];
}

export interface ProcessInput {
  title: string;
  description?: string;
  type?: "flow" | "standalone";
  status?: "pending" | "in_progress" | "done";
  flow_order?: number;
  notes?: string;
}

export interface Process {
  id: number;
  client_department_id: number;
  title: string;
  description: string | null;
  type: "flow" | "standalone";
  status: "pending" | "in_progress" | "done";
  flow_order: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("collect_token")
      : null;

  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
        `Request failed with status ${response.status}`
    );
  }

  return data as T;
}

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

export const api = {
  async login(
    username: string,
    password: string,
    role: "admin" | "client" = "client"
  ): Promise<LoginResponse> {
    const endpoint =
      role === "admin"
        ? "/admin-login"
        : "/client-login";

    const result = await request<LoginResponse>(
      endpoint,
      {
        method: "POST",
        body: JSON.stringify({
          username,
          password,
        }),
      }
    );

    saveLogin(result);

    return result;
  },

  async me(): Promise<MeResponse> {
    return request<MeResponse>("/me");
  },

  async logout(): Promise<void> {
    try {
      await request("/logout", {
        method: "POST",
      });
    } catch {
      // Session may already be invalid; clear locally anyway.
    } finally {
      clearLogin();

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  },

  /*
  |--------------------------------------------------------------------------
  | Clients
  |--------------------------------------------------------------------------
  */

  async getClients(): Promise<Client[]> {
    return request<Client[]>("/clients");
  },

  async getClient(
    clientId: number
  ): Promise<Client> {
    return request<Client>(
      `/clients/${clientId}`
    );
  },

  async createClient(
    name: string,
    email: string | undefined,
    username: string,
    password: string
  ): Promise<Client> {
    return request<Client>(
      "/clients",
      {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          username,
          password,
        }),
      }
    );
  },

  /*
  |--------------------------------------------------------------------------
  | Departments
  |--------------------------------------------------------------------------
  */

  async getClientDepartments(
    clientId: number
  ): Promise<ClientDepartment[]> {
    return request<ClientDepartment[]>(
      `/clients/${clientId}/departments`
    );
  },

  async assignDepartment(
    clientId: number,
    departmentId: number
  ): Promise<{
    id: number;
    client_id: number;
    department_id: number;
  }> {
    return request(
      `/clients/${clientId}/departments`,
      {
        method: "POST",
        body: JSON.stringify({
          department_id: departmentId,
        }),
      }
    );
  },

  async getDepartments(): Promise<Department[]> {
    return request<Department[]>("/departments");
  },

  async createDepartment(
    name: string,
    description?: string
  ): Promise<Department> {
    return request<Department>(
      "/departments",
      {
        method: "POST",
        body: JSON.stringify({
          name,
          description,
        }),
      }
    );
  },

  /*
  |--------------------------------------------------------------------------
  | Processes
  |--------------------------------------------------------------------------
  */

  async getProcesses(
    clientId: number,
    departmentId: number
  ): Promise<Process[]> {
    return request<Process[]>(
      `/clients/${clientId}/departments/${departmentId}/processes`
    );
  },

  async createProcess(
    clientId: number,
    departmentId: number,
    data: ProcessInput
  ): Promise<Process> {
    return request<Process>(
      `/clients/${clientId}/departments/${departmentId}/processes`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },

  async updateProcess(
    processId: number,
    data: Partial<ProcessInput>
  ): Promise<Process> {
    return request<Process>(
      `/processes/${processId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
  },

  async deleteProcess(
    processId: number
  ): Promise<{ success: boolean }> {
    return request(
      `/processes/${processId}`,
      {
        method: "DELETE",
      }
    );
  },

  /*
  |--------------------------------------------------------------------------
  | Admin
  |--------------------------------------------------------------------------
  */

  async getAdminOverview(): Promise<AdminClient[]> {
    return request<AdminClient[]>("/admin/overview");
  },

  async getAdminProcesses(
    clientId: number,
    departmentId: number
  ): Promise<Process[]> {
    return request<Process[]>(
      `/admin/clients/${clientId}/departments/${departmentId}/processes`
    );
  },
};

/*
|--------------------------------------------------------------------------
| Login storage
|--------------------------------------------------------------------------
*/

function saveLogin(
  result: LoginResponse
) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    "collect_token",
    result.token
  );

  localStorage.setItem(
    "collect_role",
    result.role
  );

  /*
   * Save complete client information.
   */

  if (result.client) {
    localStorage.setItem(
      "collect_client",
      JSON.stringify(result.client)
    );

    /*
     * This is useful for components that
     * only need the ID.
     */

    localStorage.setItem(
      "collect_client_id",
      String(result.client.id)
    );
  }

  if (result.username) {
    localStorage.setItem(
      "collect_username",
      result.username
    );
  }
}

/*
|--------------------------------------------------------------------------
| Public auth helpers
|--------------------------------------------------------------------------
*/

export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(
    "collect_token"
  );
}

export function getRole():
  | "admin"
  | "client"
  | null {
  if (typeof window === "undefined") {
    return null;
  }

  const role =
    localStorage.getItem("collect_role");

  if (
    role === "admin" ||
    role === "client"
  ) {
    return role;
  }

  return null;
}

export function getClientId(): number | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value =
    localStorage.getItem(
      "collect_client_id"
    );

  if (!value) {
    return null;
  }

  const id = Number(value);

  return Number.isInteger(id)
    ? id
    : null;
}

export function getStoredClient(): Client | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value =
    localStorage.getItem(
      "collect_client"
    );

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as Client;
  } catch {
    return null;
  }
}

export function clearLogin() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    "collect_token"
  );

  localStorage.removeItem(
    "collect_role"
  );

  localStorage.removeItem(
    "collect_client"
  );

  localStorage.removeItem(
    "collect_client_id"
  );

  localStorage.removeItem(
    "collect_username"
  );
}