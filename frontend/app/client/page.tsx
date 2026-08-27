'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  api,
  Client,
  ClientDepartment,
  Department,
  Process,
} from '@/lib/api';

import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  X,
  ArrowRight,
  LogOut,
  Building2,
  ClipboardList,
  CheckCircle2,
  Clock3,
  PlayCircle,
} from 'lucide-react';

const STATUS_STYLES: Record<
  string,
  string
> = {
  pending:
    'bg-amber-100 text-amber-700 border border-amber-200',

  in_progress:
    'bg-blue-100 text-blue-700 border border-blue-200',

  done:
    'bg-green-100 text-green-700 border border-green-200',
};

const STATUS_LABELS: Record<
  string,
  string
> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  done: 'Done',
};

const TYPE_STYLES: Record<
  string,
  string
> = {
  flow:
    'bg-purple-100 text-purple-700 border border-purple-200',

  standalone:
    'bg-slate-100 text-slate-600 border border-slate-200',
};

function Badge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}

/*
|--------------------------------------------------------------------------
| Process Modal
|--------------------------------------------------------------------------
*/

function ProcessModal({
  onClose,
  onSave,
  initial,
}: {
  onClose: () => void;
  onSave: (
    data: Partial<Process>
  ) => Promise<void>;
  initial?: Process;
}) {
  const [title, setTitle] =
    useState(
      initial?.title ?? ''
    );

  const [description, setDescription] =
    useState(
      initial?.description ??
        ''
    );

  const [type, setType] =
    useState<
      'flow' | 'standalone'
    >(
      initial?.type ??
        'standalone'
    );

  const [status, setStatus] =
    useState<
      | 'pending'
      | 'in_progress'
      | 'done'
    >(
      initial?.status ??
        'pending'
    );

  const [flowOrder, setFlowOrder] =
    useState(
      initial?.flow_order?.toString() ??
        ''
    );

  const [notes, setNotes] =
    useState(
      initial?.notes ?? ''
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const handleSave =
    async () => {
      setError('');

      if (!title.trim()) {
        setError(
          'Process title is required'
        );
        return;
      }

      if (
        type === 'flow' &&
        flowOrder &&
        Number(flowOrder) < 1
      ) {
        setError(
          'Flow order must be at least 1'
        );
        return;
      }

      setSaving(true);

      try {
        await onSave({
          title: title.trim(),
          description:
            description.trim(),
          type,
          status,
          flow_order:
            type === 'flow' &&
            flowOrder
              ? Number(
                  flowOrder
                )
              : undefined,
          notes: notes.trim(),
        });

        onClose();
      } catch (e: any) {
        setError(
          e.message ??
            'Failed to save process'
        );
      } finally {
        setSaving(false);
      }
    };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {initial
                ? 'Edit Process'
                : 'Add Process'}
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Define the process and its current status.
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
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Process Title *
            </label>

            <input
              value={title}
              onChange={(e) =>
                setTitle(
                  e.target.value
                )
              }
              placeholder="e.g. Prepare financial statements"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Description
            </label>

            <textarea
              value={
                description
              }
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              rows={3}
              placeholder="Describe this process..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Process Type
              </label>

              <select
                value={type}
                onChange={(e) =>
                  setType(
                    e.target
                      .value as
                      | 'flow'
                      | 'standalone'
                  )
                }
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="standalone">
                  Standalone
                </option>

                <option value="flow">
                  Flow / Ordered
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Status
              </label>

              <select
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target
                      .value as
                      | 'pending'
                      | 'in_progress'
                      | 'done'
                  )
                }
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="pending">
                  Pending
                </option>

                <option value="in_progress">
                  In Progress
                </option>

                <option value="done">
                  Done
                </option>
              </select>
            </div>
          </div>

          {type === 'flow' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Flow Order
              </label>

              <input
                type="number"
                min={1}
                value={
                  flowOrder
                }
                onChange={(e) =>
                  setFlowOrder(
                    e.target.value
                  )
                }
                placeholder="1"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Notes
            </label>

            <textarea
              value={notes}
              onChange={(e) =>
                setNotes(
                  e.target.value
                )
              }
              rows={2}
              placeholder="Additional notes..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
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
            onClick={handleSave}
            disabled={
              saving ||
              !title.trim()
            }
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm rounded-xl font-semibold flex items-center gap-2"
          >
            {saving && (
              <Loader2
                size={15}
                className="animate-spin"
              />
            )}

            {initial
              ? 'Update Process'
              : 'Add Process'}
          </button>
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Process Card
|--------------------------------------------------------------------------
*/

function ProcessCard({
  process,
  onEdit,
  onDelete,
}: {
  process: Process;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 group hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-semibold text-slate-900 text-sm">
              {process.title}
            </p>

            <Badge
              label={
                process.type ===
                'flow'
                  ? 'Flow'
                  : 'Standalone'
              }
              className={
                TYPE_STYLES[
                  process.type
                ]
              }
            />

            <Badge
              label={
                STATUS_LABELS[
                  process.status
                ]
              }
              className={
                STATUS_STYLES[
                  process.status
                ]
              }
            />
          </div>

          {process.description && (
            <p className="text-xs text-slate-500 mt-1">
              {
                process.description
              }
            </p>
          )}

          {process.notes && (
            <p className="text-xs text-slate-400 mt-1 italic">
              Note:{' '}
              {
                process.notes
              }
            </p>
          )}
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={onEdit}
            title="Edit"
            className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>

          <button
            onClick={onDelete}
            title="Delete"
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
          >
            <Trash2
              size={14}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Create Department Modal
|--------------------------------------------------------------------------
*/

function DepartmentModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (
    name: string,
    description?: string
  ) => Promise<void>;
}) {
  const [name, setName] =
    useState('');

  const [description, setDescription] =
    useState('');

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const save = async () => {
    setError('');

    if (!name.trim()) {
      setError(
        'Department name is required'
      );
      return;
    }

    setSaving(true);

    try {
      await onSave(
        name.trim(),
        description.trim() ||
          undefined
      );

      onClose();
    } catch (e: any) {
      setError(
        e.message ??
          'Failed to create department'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Add Department
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Create a department for your organization.
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
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Department Name *
            </label>

            <input
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value
                )
              }
              placeholder="e.g. Accounting"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Description
            </label>

            <textarea
              value={
                description
              }
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              rows={3}
              placeholder="What does this department handle?"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
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
            disabled={
              saving ||
              !name.trim()
            }
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center gap-2"
          >
            {saving && (
              <Loader2
                size={15}
                className="animate-spin"
              />
            )}

            Create Department
          </button>
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Department Panel
|--------------------------------------------------------------------------
*/

function DepartmentPanel({
  clientId,
  dept,
  onChanged,
}: {
  clientId: number;
  dept: ClientDepartment;
  onChanged: () => void;
}) {
  const [processes, setProcesses] =
    useState<Process[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [open, setOpen] =
    useState(false);

  const [modal, setModal] =
    useState<{
      mode:
        | 'add'
        | 'edit';
      process?: Process;
    } | null>(null);

  const load = async () => {
    setLoading(true);

    try {
      const result =
        await api.getProcesses(
          clientId,
          dept.department_id
        );

      setProcesses(result);
    } finally {
      setLoading(false);
    }
  };

  const toggle = async () => {
    if (!open) {
      await load();
    }

    setOpen(
      (value) => !value
    );
  };

  const handleSave =
    async (
      data: Partial<Process>
    ) => {
      if (
        modal?.mode ===
          'edit' &&
        modal.process
      ) {
        const updated =
          await api.updateProcess(
            modal.process.id,
            data
          );

        setProcesses(
          (prev) =>
            prev.map((p) =>
              p.id ===
              updated.id
                ? updated
                : p
            )
        );
      } else {
        const created =
          await api.createProcess(
            clientId,
            dept.client_department_id,
            data
          );

        setProcesses(
          (prev) => [
            ...prev,
            created,
          ]
        );
      }

      onChanged();
    };

  const handleDelete =
    async (id: number) => {
      if (
        !window.confirm(
          'Delete this process?'
        )
      ) {
        return;
      }

      try {
        await api.deleteProcess(
          id
        );

        setProcesses(
          (prev) =>
            prev.filter(
              (p) =>
                p.id !== id
            )
        );

        onChanged();
      } catch (e: any) {
        window.alert(
          e.message ??
            'Failed to delete process'
        );
      }
    };

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

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-3">
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

          <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Building2
              size={17}
            />
          </div>

          <div className="text-left">
            <p className="font-bold text-slate-900 text-sm">
              {dept.name}
            </p>

            {dept.description && (
              <p className="text-xs text-slate-500 mt-0.5">
                {
                  dept.description
                }
              </p>
            )}
          </div>
        </div>

        <span className="text-xs bg-brand-50 text-brand-700 font-semibold px-2.5 py-1 rounded-full border border-brand-100">
          {dept.process_count}{' '}
          process
          {dept.process_count !==
          1
            ? 'es'
            : ''}
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-5">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2
                size={24}
                className="animate-spin text-brand-600"
              />
            </div>
          ) : (
            <div className="space-y-5">
              {flowProcesses.length >
                0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Flow Steps
                  </p>

                  <div className="space-y-2">
                    {flowProcesses.map(
                      (process, i) => (
                        <div
                          key={
                            process.id
                          }
                          className="flex items-start gap-3"
                        >
                          <div className="flex flex-col items-center shrink-0">
                            <div className="w-8 h-8 rounded-full bg-purple-100 border-2 border-purple-300 flex items-center justify-center text-xs font-bold text-purple-700">
                              {process.flow_order ??
                                i +
                                  1}
                            </div>

                            {i <
                              flowProcesses.length -
                                1 && (
                              <div className="w-0.5 h-4 bg-purple-200 my-1" />
                            )}
                          </div>

                          <ProcessCard
                            process={
                              process
                            }
                            onEdit={() =>
                              setModal(
                                {
                                  mode:
                                    'edit',
                                  process,
                                }
                              )
                            }
                            onDelete={() =>
                              handleDelete(
                                process.id
                              )
                            }
                          />
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
                      (process) => (
                        <ProcessCard
                          key={
                            process.id
                          }
                          process={
                            process
                          }
                          onEdit={() =>
                            setModal(
                              {
                                mode:
                                  'edit',
                                process,
                              }
                            )
                          }
                          onDelete={() =>
                            handleDelete(
                              process.id
                            )
                          }
                        />
                      )
                    )}
                  </div>
                </div>
              )}

              {processes.length ===
                0 && (
                <div className="text-center py-6">
                  <ClipboardList
                    size={32}
                    className="mx-auto text-slate-300 mb-2"
                  />

                  <p className="text-sm text-slate-400">
                    No processes yet.
                  </p>
                </div>
              )}

              <button
                onClick={() =>
                  setModal({
                    mode: 'add',
                  })
                }
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-brand-200 hover:border-brand-400 text-brand-600 hover:text-brand-700 rounded-xl py-3 text-sm font-semibold transition"
              >
                <Plus
                  size={16}
                />
                Add Process
              </button>
            </div>
          )}
        </div>
      )}

      {modal && (
        <ProcessModal
          initial={
            modal.process
          }
          onClose={() =>
            setModal(null)
          }
          onSave={
            handleSave
          }
        />
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Client Page
|--------------------------------------------------------------------------
*/

export default function ClientPage() {
  const [client, setClient] =
    useState<Client | null>(
      null
    );

  const [departments, setDepartments] =
    useState<
      ClientDepartment[]
    >([]);

  const [allDepartments, setAllDepartments] =
    useState<Department[]>(
      []
    );

  const [loading, setLoading] =
    useState(true);

  const [showDepartmentModal, setShowDepartmentModal] =
    useState(false);

  const [showAssign, setShowAssign] =
    useState(false);

  const [error, setError] =
    useState('');

  const loadClient =
    async () => {
      setLoading(true);

      try {
        const [
          currentClient,
          myDepartments,
          availableDepartments,
        ] =
          await Promise.all([
            api.getMyClient(),
            api.getMyDepartments(),
            api.getDepartments(),
          ]);

        setClient(
          currentClient
        );

        setDepartments(
          myDepartments
        );

        setAllDepartments(
          availableDepartments
        );
      } catch (e: any) {
        setError(
          e.message ??
            'Unable to load client portal'
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadClient();
  }, []);

  const createDepartment =
    async (
      name: string,
      description?: string
    ) => {
      const created =
        await api.createMyDepartment(
          name,
          description
        );

      setDepartments(
        (prev) => [
          ...prev,
          created,
        ]
      );
    };

  const assignDepartment =
    async (
      departmentId: number
    ) => {
      try {
        await api.assignMyDepartment(
          departmentId
        );

        const updated =
          await api.getMyDepartments();

        setDepartments(
          updated
        );

        setShowAssign(false);
      } catch (e: any) {
        setError(
          e.message ??
            'Failed to assign department'
        );
      }
    };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      window.location.href =
        '/login';
    }
  };

  const refreshDepartments =
    async () => {
      try {
        const updated =
          await api.getMyDepartments();

        setDepartments(
          updated
        );
      } catch {}
    };

  const assignedIds =
    new Set(
      departments.map(
        (d) =>
          d.department_id
      )
    );

  const unassigned =
    allDepartments.filter(
      (d) =>
        !assignedIds.has(
          d.id
        )
    );

  const totalProcesses =
    departments.reduce(
      (sum, dept) =>
        sum +
        Number(
          dept.process_count
        ),
      0
    );

  const completedProcesses =
    departments.reduce(
      (sum, dept) =>
        sum,
      0
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

  if (!client) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-red-200 p-6 text-center max-w-md">
          <p className="text-red-600 font-semibold">
            {error ||
              'Unable to load client'}
          </p>

          <button
            onClick={() =>
              (window.location.href =
                '/login')
            }
            className="mt-4 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50">
      <header className="bg-white/90 backdrop-blur border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
              <Building2
                size={20}
              />
            </div>

            <div>
              <h1 className="text-lg font-bold text-slate-900">
                {client.name}
              </h1>

              <p className="text-xs text-slate-500">
                Client Portal
                {client.email
                  ? ` • ${client.email}`
                  : ''}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
          >
            <LogOut
              size={15}
            />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 flex items-center justify-between text-sm">
            <span>
              {error}
            </span>

            <button
              onClick={() =>
                setError('')
              }
            >
              <X
                size={16}
              />
            </button>
          </div>
        )}

        {/* Client summary */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-1">
                Your Workspace
              </p>

              <h2 className="text-2xl font-bold text-slate-900">
                {client.name}
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Manage your departments and processes from one place.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-2xl px-5 py-3">
                <p className="text-xl font-bold text-slate-900">
                  {
                    departments.length
                  }
                </p>

                <p className="text-xs text-slate-500">
                  Departments
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl px-5 py-3">
                <p className="text-xl font-bold text-slate-900">
                  {
                    totalProcesses
                  }
                </p>

                <p className="text-xs text-slate-500">
                  Processes
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Department actions */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-5">
          <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900">
                Departments
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Departments belonging to your account
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  setShowAssign(
                    (value) =>
                      !value
                  )
                }
                className="px-3 py-2 border border-brand-200 text-brand-600 hover:bg-brand-50 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus
                  size={14}
                />
                Assign Existing
              </button>

              <button
                onClick={() =>
                  setShowDepartmentModal(
                    true
                  )
                }
                className="px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus
                  size={14}
                />
                Create Department
              </button>
            </div>
          </div>

          {showAssign && (
            <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/60">
              <p className="text-sm font-semibold text-slate-700 mb-3">
                Available departments
              </p>

              {unassigned.length ===
              0 ? (
                <p className="text-xs text-slate-400">
                  All available departments are already assigned.
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {unassigned.map(
                    (department) => (
                      <button
                        key={
                          department.id
                        }
                        onClick={() =>
                          assignDepartment(
                            department.id
                          )
                        }
                        className="text-left p-3 bg-white border border-slate-200 hover:border-brand-400 hover:bg-brand-50 rounded-xl transition"
                      >
                        <p className="font-semibold text-sm text-slate-800">
                          {
                            department.name
                          }
                        </p>

                        {department.description && (
                          <p className="text-xs text-slate-400 mt-1">
                            {
                              department.description
                            }
                          </p>
                        )}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Department list */}
        {departments.length ===
        0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-3xl py-16 text-center">
            <Building2
              size={42}
              className="mx-auto text-slate-300 mb-3"
            />

            <h3 className="font-bold text-slate-700">
              No departments yet
            </h3>

            <p className="text-sm text-slate-400 mt-1">
              Create your first department to start tracking processes.
            </p>

            <button
              onClick={() =>
                setShowDepartmentModal(
                  true
                )
              }
              className="mt-5 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold inline-flex items-center gap-2"
            >
              <Plus
                size={16}
              />
              Create Department
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {departments.map(
              (department) => (
                <DepartmentPanel
                  key={
                    department.client_department_id
                  }
                  clientId={
                    client.id
                  }
                  dept={
                    department
                  }
                  onChanged={
                    refreshDepartments
                  }
                />
              )
            )}
          </div>
        )}
      </main>

      {showDepartmentModal && (
        <DepartmentModal
          onClose={() =>
            setShowDepartmentModal(
              false
            )
          }
          onSave={
            createDepartment
          }
        />
      )}
    </div>
  );
}