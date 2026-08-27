'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  api,
  AdminClient,
  Process,
} from '@/lib/api';

import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Users,
  Building2,
  ClipboardList,
  Search,
  X,
  ShieldCheck,
  LogOut,
} from 'lucide-react';

const STATUS_STYLES: Record<
  string,
  string
> = {
  pending:
    'bg-amber-100 text-amber-700',
  in_progress:
    'bg-blue-100 text-blue-700',
  done:
    'bg-green-100 text-green-700',
};

const STATUS_LABELS: Record<
  string,
  string
> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  done: 'Done',
};

function ProcessTable({
  processes,
}: {
  processes: Process[];
}) {
  const flowProcesses =
    processes
      .filter(
        (p) =>
          p.type === 'flow'
      )
      .sort(
        (a, b) =>
          (a.flow_order ?? 0) -
          (b.flow_order ?? 0)
      );

  const standaloneProcesses =
    processes.filter(
      (p) =>
        p.type ===
        'standalone'
    );

  if (
    processes.length === 0
  ) {
    return (
      <p className="text-sm text-slate-400 text-center py-6">
        No processes recorded yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {flowProcesses.length >
        0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Flow Steps
          </p>

          <div className="relative">
            {flowProcesses.map(
              (p, i) => (
                <div
                  key={p.id}
                  className="flex items-start gap-3 mb-2"
                >
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-8 h-8 rounded-full bg-purple-100 border-2 border-purple-300 flex items-center justify-center text-xs font-bold text-purple-700">
                      {p.flow_order ??
                        i + 1}
                    </div>

                    {i <
                      flowProcesses.length -
                        1 && (
                      <div className="w-0.5 h-5 bg-purple-200 mt-1" />
                    )}
                  </div>

                  <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">
                          {p.title}
                        </p>

                        {p.description && (
                          <p className="text-xs text-slate-500 mt-1">
                            {
                              p.description
                            }
                          </p>
                        )}

                        {p.notes && (
                          <p className="text-xs text-slate-400 mt-1 italic">
                            Note:{' '}
                            {
                              p.notes
                            }
                          </p>
                        )}
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${
                          STATUS_STYLES[
                            p.status
                          ]
                        }`}
                      >
                        {
                          STATUS_LABELS[
                            p.status
                          ]
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {standaloneProcesses.length >
        0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Standalone
          </p>

          <div className="space-y-2">
            {standaloneProcesses.map(
              (p) => (
                <div
                  key={p.id}
                  className="bg-white border border-slate-200 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">
                        {p.title}
                      </p>

                      {p.description && (
                        <p className="text-xs text-slate-500 mt-1">
                          {
                            p.description
                          }
                        </p>
                      )}

                      {p.notes && (
                        <p className="text-xs text-slate-400 mt-1 italic">
                          {
                            p.notes
                          }
                        </p>
                      )}
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${
                        STATUS_STYLES[
                          p.status
                        ]
                      }`}
                    >
                      {
                        STATUS_LABELS[
                          p.status
                        ]
                      }
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DepartmentRow({
  clientId,
  dept,
}: {
  clientId: number;
  dept: any;
}) {
  const [open, setOpen] =
    useState(false);

  const [processes, setProcesses] =
    useState<Process[]>([]);

  const [loading, setLoading] =
    useState(false);

  const toggle = async () => {
    if (
      !open &&
      processes.length === 0
    ) {
      setLoading(true);

      try {
        const data =
          await api.getAdminProcesses(
            clientId,
            dept.department_id
          );

        setProcesses(data);
      } finally {
        setLoading(false);
      }
    }

    setOpen(
      (value) => !value
    );
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-3">
          {open ? (
            <ChevronDown
              size={16}
              className="text-brand-600"
            />
          ) : (
            <ChevronRight
              size={16}
              className="text-slate-400"
            />
          )}

          <Building2
            size={15}
            className="text-slate-400"
          />

          <span className="font-semibold text-slate-800 text-sm">
            {dept.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {dept.process_count}{' '}
            process
            {dept.process_count !==
            1
              ? 'es'
              : ''}
          </span>

          {loading && (
            <Loader2
              size={13}
              className="animate-spin text-brand-500"
            />
          )}
        </div>
      </button>

      {open &&
        !loading && (
          <div className="border-t border-slate-100 bg-slate-50/60 p-4">
            <ProcessTable
              processes={
                processes
              }
            />
          </div>
        )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Add Client Modal
|--------------------------------------------------------------------------
*/

function AddClientModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (
    client: AdminClient
  ) => void;
}) {
  const [name, setName] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [username, setUsername] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const save = async () => {
    setError('');

    if (!name.trim()) {
      setError(
        'Client name is required'
      );
      return;
    }

    if (!username.trim()) {
      setError(
        'Username is required'
      );
      return;
    }

    if (password.length < 6) {
      setError(
        'Password must be at least 6 characters'
      );
      return;
    }

    setSaving(true);

    try {
      const client =
        await api.createClient(
          name.trim(),
          email.trim() ||
            undefined,
          username.trim(),
          password
        );

      onCreated({
        ...client,
        departments: [],
      });

      onClose();
    } catch (e: any) {
      setError(
        e.message ??
          'Failed to create client'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Add Client
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Create the client's login credentials.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Client Name *
            </label>

            <input
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value
                )
              }
              placeholder="ABC Company"
              className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Email
            </label>

            <input
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              placeholder="client@example.com"
              className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Login Username *
              </label>

              <input
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value
                  )
                }
                placeholder="abc_company"
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Password *
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                placeholder="Minimum 6 characters"
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600"
          >
            Cancel
          </button>

          <button
            onClick={save}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold flex items-center gap-2"
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

/*
|--------------------------------------------------------------------------
| Client row
|--------------------------------------------------------------------------
*/

function ClientRow({
  client,
}: {
  client: AdminClient;
}) {
  const [open, setOpen] =
    useState(false);

  const totalProcesses =
    client.departments.reduce(
      (sum, dept) =>
        sum +
        Number(
          dept.process_count
        ),
      0
    );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <button
        onClick={() =>
          setOpen(
            (value) => !value
          )
        }
        className="w-full flex items-center justify-between px-6 py-5 hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
            {client.name
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="text-left">
            <p className="font-bold text-slate-900">
              {client.name}
            </p>

            {client.email && (
              <p className="text-xs text-slate-500 mt-0.5">
                {client.email}
              </p>
            )}

            {client.username && (
              <p className="text-xs text-slate-400 mt-0.5">
                Login:{' '}
                {
                  client.username
                }
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-xs text-slate-400">
              {
                client
                  .departments
                  .length
              }{' '}
              departments
            </p>

            <p className="text-xs text-slate-400">
              {totalProcesses}{' '}
              processes
            </p>
          </div>

          {open ? (
            <ChevronDown
              size={18}
              className="text-brand-600"
            />
          ) : (
            <ChevronRight
              size={18}
              className="text-slate-400"
            />
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-6 py-5 bg-slate-50/50 space-y-3">
          {client.departments.length ===
          0 ? (
            <p className="text-sm text-slate-400 py-5 text-center">
              This client has no departments yet.
            </p>
          ) : (
            client.departments.map(
              (dept) => (
                <DepartmentRow
                  key={
                    dept.client_department_id
                  }
                  clientId={
                    client.id
                  }
                  dept={dept}
                />
              )
            )
          )}
        </div>
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Admin Page
|--------------------------------------------------------------------------
*/

export default function AdminPage() {
  const [data, setData] =
    useState<AdminClient[]>(
      []
    );

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState('');

  const [showAddClient, setShowAddClient] =
    useState(false);

  const [error, setError] =
    useState('');

  useEffect(() => {
    api
      .getAdminOverview()
      .then(setData)
      .catch((e) =>
        setError(
          e.message
        )
      )
      .finally(() =>
        setLoading(false)
      );
  }, []);

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      window.location.href =
        '/login';
    }
  };

  const totalClients =
    data.length;

  const totalDepts =
    data.reduce(
      (sum, client) =>
        sum +
        client.departments
          .length,
      0
    );

  const totalProcesses =
    data.reduce(
      (sum, client) =>
        sum +
        client.departments.reduce(
          (
            deptSum,
            dept
          ) =>
            deptSum +
            Number(
              dept.process_count
            ),
          0
        ),
      0
    );

  const filtered =
    data.filter(
      (client) => {
        const q =
          search
            .toLowerCase()
            .trim();

        if (!q) {
          return true;
        }

        return (
          client.name
            .toLowerCase()
            .includes(q) ||
          (
            client.email ??
            ''
          )
            .toLowerCase()
            .includes(q) ||
          (
            client.username ??
            ''
          )
            .toLowerCase()
            .includes(q)
        );
      }
    );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2
          size={32}
          className="animate-spin text-brand-600"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50">
      <header className="bg-white/90 backdrop-blur border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
              <ShieldCheck
                size={20}
              />
            </div>

            <div>
              <h1 className="font-bold text-slate-900">
                Admin Dashboard
              </h1>

              <p className="text-xs text-slate-500">
                Manage and monitor all clients
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-red-600 px-3 py-2 rounded-xl hover:bg-red-50"
          >
            <LogOut
              size={15}
            />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
              <Users
                size={20}
              />
            </div>

            <p className="text-2xl font-bold text-slate-900">
              {totalClients}
            </p>

            <p className="text-xs text-slate-500">
              Total Clients
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <Building2
                size={20}
              />
            </div>

            <p className="text-2xl font-bold text-slate-900">
              {totalDepts}
            </p>

            <p className="text-xs text-slate-500">
              Departments
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-3">
              <ClipboardList
                size={20}
              />
            </div>

            <p className="text-2xl font-bold text-slate-900">
              {totalProcesses}
            </p>

            <p className="text-xs text-slate-500">
              Processes
            </p>
          </div>
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
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search clients..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
            />
          </div>

          <button
            onClick={() =>
              setShowAddClient(
                true
              )
            }
            className="px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20"
          >
            <Users
              size={16}
            />
            Add Client
          </button>
        </div>

        {filtered.length ===
        0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl py-16 text-center">
            <Users
              size={40}
              className="mx-auto text-slate-300 mb-3"
            />

            <p className="font-semibold text-slate-600">
              {search
                ? 'No clients match your search'
                : 'No clients yet'}
            </p>

            {!search && (
              <button
                onClick={() =>
                  setShowAddClient(
                    true
                  )
                }
                className="mt-3 text-brand-600 text-sm font-semibold hover:underline"
              >
                Add your first client
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(
              (client) => (
                <ClientRow
                  key={client.id}
                  client={client}
                />
              )
            )}
          </div>
        )}
      </main>

      {showAddClient && (
        <AddClientModal
          onClose={() =>
            setShowAddClient(
              false
            )
          }
          onCreated={(
            client
          ) =>
            setData(
              (prev) => [
                client,
                ...prev,
              ]
            )
          }
        />
      )}
    </div>
  );
}