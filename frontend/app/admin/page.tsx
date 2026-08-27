"use client";

import { useEffect, useMemo, useState } from "react";
import {
  api,
  AdminClient,
  Process,
} from "@/lib/api";

import {
  AlertCircle,
  Building2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Loader2,
  LogOut,
  Plus,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  pending:
    "bg-amber-50 text-amber-700 border border-amber-200",
  in_progress:
    "bg-blue-50 text-blue-700 border border-blue-200",
  done:
    "bg-green-50 text-green-700 border border-green-200",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  done: "Done",
};

function ProcessTable({
  processes,
}: {
  processes: Process[];
}) {
  const flowProcesses = processes
    .filter((p) => p.type === "flow")
    .sort(
      (a, b) =>
        (a.flow_order ?? 0) -
        (b.flow_order ?? 0)
    );

  const standaloneProcesses = processes.filter(
    (p) => p.type === "standalone"
  );

  if (processes.length === 0) {
    return (
      <div className="py-8 text-center">
        <ClipboardList
          size={30}
          className="mx-auto text-slate-300 mb-2"
        />

        <p className="text-sm text-slate-400">
          No processes recorded.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {flowProcesses.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Flow Steps
            </p>
          </div>

          <div className="space-y-2">
            {flowProcesses.map((process, index) => (
              <div
                key={process.id}
                className="flex gap-3"
              >
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700">
                    {process.flow_order ??
                      index + 1}
                  </div>

                  {index <
                    flowProcesses.length - 1 && (
                    <div className="w-px flex-1 bg-indigo-100 my-1" />
                  )}
                </div>

                <ProcessDisplayCard
                  process={process}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {standaloneProcesses.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Standalone
            </p>
          </div>

          <div className="space-y-2">
            {standaloneProcesses.map(
              (process) => (
                <ProcessDisplayCard
                  key={process.id}
                  process={process}
                />
              )
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function ProcessDisplayCard({
  process,
}: {
  process: Process;
}) {
  return (
    <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-4">

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-slate-900">
              {process.title}
            </p>

            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
              {process.type === "flow"
                ? "Flow"
                : "Standalone"}
            </span>
          </div>

          {process.description && (
            <p className="text-xs text-slate-500 mt-2">
              {process.description}
            </p>
          )}

          {process.notes && (
            <p className="text-xs text-slate-400 mt-2 italic">
              {process.notes}
            </p>
          )}
        </div>

        <span
          className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${
            STATUS_STYLES[
              process.status
            ] ||
            "bg-slate-100 text-slate-600"
          }`}
        >
          {STATUS_LABELS[
            process.status
          ] || process.status}
        </span>
      </div>
    </div>
  );
}

function DepartmentRow({
  clientId,
  department,
}: {
  clientId: number;
  department: AdminClient["departments"][number];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processes, setProcesses] =
    useState<Process[]>([]);

  const toggle = async () => {
    if (!open && processes.length === 0) {
      setLoading(true);

      try {
        const result =
          await api.getAdminProcesses(
            clientId,
            department.department_id
          );

        setProcesses(result);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    setOpen((value) => !value);
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">

      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-white hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-3">
          {open ? (
            <ChevronDown
              size={16}
              className="text-indigo-600"
            />
          ) : (
            <ChevronRight
              size={16}
              className="text-slate-400"
            />
          )}

          <Building2
            size={16}
            className="text-slate-400"
          />

          <span className="text-sm font-semibold text-slate-800">
            {department.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {department.process_count}{" "}
            {department.process_count === 1
              ? "process"
              : "processes"}
          </span>

          {loading && (
            <Loader2
              size={14}
              className="animate-spin text-indigo-500"
            />
          )}
        </div>
      </button>

      {open && !loading && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-4">
          <ProcessTable processes={processes} />
        </div>
      )}
    </div>
  );
}

function ClientRow({
  client,
}: {
  client: AdminClient;
}) {
  const [open, setOpen] = useState(false);

  const totalProcesses = useMemo(
    () =>
      client.departments.reduce(
        (sum, department) =>
          sum + department.process_count,
        0
      ),
    [client.departments]
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

      <button
        type="button"
        onClick={() =>
          setOpen((value) => !value)
        }
        className="w-full flex items-center justify-between px-6 py-5 hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-4">

          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
            {client.name
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="text-left">
            <p className="font-bold text-slate-900">
              {client.name}
            </p>

            {client.email && (
              <p className="text-xs text-slate-500 mt-1">
                {client.email}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="hidden sm:block text-right">
            <p className="text-xs text-slate-400">
              {client.departments.length}{" "}
              departments
            </p>

            <p className="text-xs text-slate-400 mt-1">
              {totalProcesses} processes
            </p>
          </div>

          {open ? (
            <ChevronDown
              size={19}
              className="text-indigo-600"
            />
          ) : (
            <ChevronRight
              size={19}
              className="text-slate-400"
            />
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-5 space-y-3">
          {client.departments.length === 0 ? (
            <div className="text-center py-6">
              <Building2
                size={28}
                className="mx-auto text-slate-300 mb-2"
              />

              <p className="text-sm text-slate-400">
                No departments assigned.
              </p>
            </div>
          ) : (
            client.departments.map(
              (department) => (
                <DepartmentRow
                  key={
                    department.client_department_id
                  }
                  clientId={client.id}
                  department={department}
                />
              )
            )
          )}
        </div>
      )}
    </div>
  );
}

function CreateClientModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (client: AdminClient) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] =
    useState("");
  const [password, setPassword] =
    useState("");

  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState("");

  const submit = async () => {
    if (!name.trim()) {
      setError("Client name is required.");
      return;
    }

    if (!username.trim()) {
      setError("Username is required.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const client =
        await api.createClient(
          name.trim(),
          email.trim() || undefined,
          username.trim(),
          password
        );

      onCreated({
        ...client,
        departments: [],
      });

      onClose();
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to create client."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">

        <div className="px-6 py-5 border-b flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg text-slate-900">
              Add New Client
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Create the client's login account.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-5 flex gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
            <AlertCircle
              size={17}
              className="shrink-0"
            />
            {error}
          </div>
        )}

        <div className="p-6 space-y-4">

          <div>
            <label className="label">
              Company Name
            </label>

            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="ABC Private Limited"
              className="input"
            />
          </div>

          <div>
            <label className="label">
              Email
            </label>

            <input
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              type="email"
              placeholder="client@example.com"
              className="input"
            />
          </div>

          <div>
            <label className="label">
              Client Username
            </label>

            <input
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              placeholder="abc_client"
              className="input"
            />
          </div>

          <div>
            <label className="label">
              Password
            </label>

            <input
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              type="password"
              placeholder="Create password"
              className="input"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm text-slate-600"
          >
            Cancel
          </button>

          <button
            onClick={submit}
            disabled={saving}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold flex items-center gap-2"
          >
            {saving && (
              <Loader2
                size={15}
                className="animate-spin"
              />
            )}

            Create Client
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [clients, setClients] =
    useState<AdminClient[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [showCreateClient, setShowCreateClient] =
    useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);

    try {
      const user = await api.me();

      if (user.role !== "admin") {
        window.location.href = "/client";
        return;
      }

      const data =
        await api.getAdminOverview();

      setClients(data);
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to load admin dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  const filtered = clients.filter(
    (client) => {
      const query =
        search.toLowerCase().trim();

      return (
        client.name
          .toLowerCase()
          .includes(query) ||
        (client.email ?? "")
          .toLowerCase()
          .includes(query)
      );
    }
  );

  const departments = clients.reduce(
    (sum, client) =>
      sum + client.departments.length,
    0
  );

  const processes = clients.reduce(
    (sum, client) =>
      sum +
      client.departments.reduce(
        (departmentSum, department) =>
          departmentSum +
          department.process_count,
        0
      ),
    0
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">

      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <ShieldCheck size={21} />
            </div>

            <div>
              <h1 className="font-bold text-slate-900">
                Admin Dashboard
              </h1>

              <p className="text-xs text-slate-500">
                Manage clients and monitor processes
              </p>
            </div>
          </div>

          <button
            onClick={() => api.logout()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">
              Logout
            </span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex gap-3">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

          <StatCard
            icon={<Users size={20} />}
            value={clients.length}
            label="Total Clients"
          />

          <StatCard
            icon={<Building2 size={20} />}
            value={departments}
            label="Departments"
          />

          <StatCard
            icon={<ClipboardList size={20} />}
            value={processes}
            label="Processes"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">

          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search clients..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={() =>
              setShowCreateClient(true)
            }
            className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold"
          >
            <Plus size={17} />
            Add Client
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2
              size={30}
              className="animate-spin text-indigo-500"
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl py-16 text-center">
            <Users
              size={38}
              className="mx-auto text-slate-300 mb-3"
            />

            <p className="font-semibold text-slate-700">
              {search
                ? "No clients found"
                : "No clients yet"}
            </p>

            {!search && (
              <p className="text-sm text-slate-400 mt-1">
                Click "Add Client" to create the
                first client.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((client) => (
              <ClientRow
                key={client.id}
                client={client}
              />
            ))}
          </div>
        )}
      </div>

      {showCreateClient && (
        <CreateClientModal
          onClose={() =>
            setShowCreateClient(false)
          }
          onCreated={(client) => {
            setClients((current) => [
              client,
              ...current,
            ]);
          }}
        />
      )}
    </main>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
        {icon}
      </div>

      <p className="text-2xl font-bold text-slate-900">
        {value}
      </p>

      <p className="text-xs text-slate-500 mt-1">
        {label}
      </p>
    </div>
  );
}