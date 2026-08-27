const BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface Client {
  id: number;
  name: string;
  email?: string | null;
  username?: string | null;
  created_at: string;
}

export interface Department {
  id: number;
  name: string;
  description?: string | null;
  created_at?: string;
}

export interface ClientDepartment {
  client_department_id: number;
  department_id: number;
  name: string;
  description?: string | null;
  process_count: number;
}

export interface Process {
  id: number;
  client_department_id: number;
  title: string;
  description?: string | null;
  type: "flow" | "standalone";
  status: "pending" | "in_progress" | "done";
  flow_order?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminClient extends Client {
  departments: ClientDepartment[];
}

export interface AuthUser {
  role: "admin" | "client";
  client_id?: number | null;
  client?: Client | null;
  username?: string;
  name?: string;
}

export interface LoginResponse {
  token?: string;
  access_token?: string;
  user?: AuthUser;
  role?: "admin" | "client";
  client?: Client | null;
  client_id?: number | null;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;

  return (
    localStorage.getItem("collect_token") ||
    localStorage.getItem("token") ||
    null
  );
}

function saveToken(token: string) {
  if (typeof window === "undefined") return;

  localStorage.setItem("collect_token", token);
}

function clearToken() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("collect_token");
  localStorage.removeItem("token");
  localStorage.removeItem("collect_user");
}

async function req<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>).Authorization =
      `Bearer ${token}`;
  }

  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 401) {
    clearToken();

    if (
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login")
    ) {
      window.location.href = "/login";
    }

    throw new Error("Your session has expired. Please login again.");
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({
      error: response.statusText,
    }));

    throw new Error(
      (errorBody as any)?.error ||
        (errorBody as any)?.message ||
        "Request failed"
    );
  }

  return response.json();
}

export const api = {
  /* =========================================================
     AUTH
  ========================================================= */

  login: async (
    username: string,
    password: string
  ): Promise<LoginResponse> => {
    const response = await req<LoginResponse>("/login", {
      method: "POST",
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const token =
      response.token ||
      response.access_token ||
      (response as any)?.session?.token;

    if (token) {
      saveToken(token);
    }

    const user: AuthUser = {
      ...(response.user || {}),
      role:
        response.user?.role ||
        response.role ||
        "client",
      client_id:
        response.user?.client_id ??
        response.client_id ??
        null,
      client:
        response.user?.client ??
        response.client ??
        null,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(
        "collect_user",
        JSON.stringify(user)
      );
    }

    return {
      ...response,
      user,
    };
  },

  logout: async () => {
    try {
      await req("/logout", {
        method: "POST",
      });
    } catch {
      // Even if backend logout fails,
      // remove local session.
    }

    clearToken();

    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },

  me: async (): Promise<AuthUser> => {
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem("collect_user")
        : null;

    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Continue to backend.
      }
    }

    const response = await req<any>("/me");

    const user: AuthUser = {
      ...(response.user || response),
      role:
        response.user?.role ||
        response.role,
      client_id:
        response.user?.client_id ??
        response.client_id ??
        null,
      client:
        response.user?.client ??
        response.client ??
        null,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(
        "collect_user",
        JSON.stringify(user)
      );
    }

    return user;
  },

  /* =========================================================
     CLIENTS
  ========================================================= */

  getClients: () =>
    req<Client[]>("/clients"),

  getClient: (id: number) =>
    req<Client>(`/clients/${id}`),

  createClient: (
    name: string,
    email?: string,
    username?: string,
    password?: string
  ) =>
    req<Client>("/clients", {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        username,
        password,
      }),
    }),

  /* =========================================================
     CLIENT DEPARTMENTS
  ========================================================= */

  getClientDepartments: (clientId: number) =>
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
        method: "POST",
        body: JSON.stringify({
          department_id: departmentId,
        }),
      }
    ),

  /* =========================================================
     DEPARTMENTS
  ========================================================= */

  getDepartments: () =>
    req<Department[]>("/departments"),

  createDepartment: (
    name: string,
    description?: string
  ) =>
    req<Department>("/departments", {
      method: "POST",
      body: JSON.stringify({
        name,
        description,
      }),
    }),

  /* =========================================================
     PROCESSES
  ========================================================= */

  getProcesses: (
    clientId: number,
    departmentId: number
  ) =>
    req<Process[]>(
      `/clients/${clientId}/departments/${departmentId}/processes`
    ),

  createProcess: (
    clientId: number,
    departmentId: number,
    data: Partial<Process>
  ) =>
    req<Process>(
      `/clients/${clientId}/departments/${departmentId}/processes`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),

  updateProcess: (
    id: number,
    data: Partial<Process>
  ) =>
    req<Process>(`/processes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteProcess: (id: number) =>
    req(`/processes/${id}`, {
      method: "DELETE",
    }),

  /* =========================================================
     ADMIN
  ========================================================= */

  getAdminOverview: () =>
    req<AdminClient[]>("/admin/overview"),

  getAdminProcesses: (
    clientId: number,
    departmentId: number
  ) =>
    req<Process[]>(
      `/admin/clients/${clientId}/departments/${departmentId}/processes`
    ),
};