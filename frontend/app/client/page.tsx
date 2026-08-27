"use client";

import { useEffect, useMemo, useState } from "react";

import {
  api,
  Client,
  ClientDepartment,
  Department,
  Process,
} from "@/lib/api";

import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Edit3,
  Loader2,
  LogOut,
  Plus,
  Trash2,
  UserRound,
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
  done: "Completed",
};

const TYPE_STYLES: Record<string, string> = {
  flow:
    "bg-indigo-50 text-indigo-700 border border-indigo-200",
  standalone:
    "bg-slate-100 text-slate-600 border border-slate-200",
};

function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

function ProcessModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: Process;
  onClose: () => void;
  onSave: (
    data: Partial<Process>
  ) => Promise<void>;
}) {
  const [title, setTitle] = useState(
    initial?.title ?? ""
  );

  const [description, setDescription] =
    useState(initial?.description ?? "");

  const [type, setType] = useState<
    "flow" | "standalone"
  >(initial?.type ?? "standalone");

  const [status, setStatus] = useState<
    "pending" | "in_progress" | "done"
  >(initial?.status ?? "pending");

  const [flowOrder, setFlowOrder] =
    useState(
      initial?.flow_order?.toString() ?? ""
    );

  const [notes, setNotes] =
    useState(initial?.notes ?? "");

  const [saving, setSaving] =
    useState(false);

  const submit = async () => {
    if (!title.trim()) return;

    setSaving(true);

    try {
      await onSave({
        title: title.trim(),
        description:
          description.trim() || undefined,
        type,
        status,
        flow_order:
          type === "flow" && flowOrder
            ? Number(flowOrder)
            : undefined,
        notes:
          notes.trim() || undefined,
      });

      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden">

        <div className="px-6 py-5 border-b flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg text-slate-900">
              {initial
                ? "Edit Process"
                : "Add Process"}
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Configure the process details and status.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">

          <div>
            <label className="label">
              Process Title *
            </label>

            <input
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="Enter process title"
              className="input"
            />
          </div>

          <div>
            <label className="label">
              Description
            </label>

            <textarea
              rows={3}
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              placeholder="Describe this process..."
              className="input resize-none"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">

            <div>
              <label className="label">
                Process Type
              </label>

              <select
                value={type}
                onChange={(e) =>
                  setType(
                    e.target.value as
                      | "flow"
                      | "standalone"
                  )
                }
                className="input bg-white"
              >
                <option value="standalone">
                  Standalone
                </option>

                <option value="flow">
                  Flow
                </option>
              </select>
            </div>

            <div>
              <label className="label">
                Status
              </label>

              <select
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value as
                      | "pending"
                      | "in_progress"
                      | "done"
                  )
                }
                className="input bg-white"
              >
                <option value="pending">
                  Pending
                </option>

                <option value="in_progress">
                  In Progress
                </option>

                <option value="done">
                  Completed
                </option>
              </select>
            </div>
          </div>

          {type === "flow" && (
            <div>
              <label className="label">
                Flow Order
              </label>

              <input
                type="number"
                min={1}
                value={flowOrder}
                onChange={(e) =>
                  setFlowOrder(
                    e.target.value
                  )
                }
                placeholder="1"
                className="input"
              />
            </div>
          )}

          <div>
            <label className="label">
              Notes
            </label>

            <textarea
              rows={3}
              value={notes}
              onChange={(e) =>
                setNotes(e.target.value)
              }
              placeholder="Additional notes..."
              className="input resize-none"
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
            disabled={
              saving || !title.trim()
            }
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold flex items-center gap-2"
          >
            {saving && (
              <Loader2
                size={15}
                className="animate-spin"
              />
            )}

            {initial
              ? "Save Changes"
              : "Add Process"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
    <div className="bg-white border border-slate-200 rounded-xl p-4 group hover:shadow-sm transition">

      <div className="flex items-start justify-between gap-4">

        <div className="min-w-0 flex-1">

          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-slate-900">
              {process.title}
            </p>

            <Badge
              className={
                TYPE_STYLES[
                  process.type
                ]
              }
            >
              {process.type === "flow"
                ? "Flow"
                : "Standalone"}
            </Badge>

            <Badge
              className={
                STATUS_STYLES[
                  process.status
                ]
              }
            >
              {STATUS_LABELS[
                process.status
              ]}
            </Badge>
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

        <div className="flex gap-1 shrink-0">

          <button
            onClick={onEdit}
            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
            title="Edit"
          >
            <Edit3 size={14} />
          </button>

          <button
            onClick={onDelete}
            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function DepartmentPanel({
  clientId,
  department,
  onProcessCountChange,
}: {
  clientId: number;
  department: ClientDepartment;
  onProcessCountChange: (
    departmentId: number,
    count: number
  ) => void;
}) {
  const [open, setOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [processes, setProcesses] =
    useState<Process[]>([]);

  const [modal, setModal] =
    useState<{
      mode: "add" | "edit";
      process?: Process;
    } | null>(null);

  const loadProcesses = async () => {
    setLoading(true);

    try {
      const result =
        await api.getProcesses(
          clientId,
          department.department_id
        );

      setProcesses(result);

      onProcessCountChange(
        department.department_id,
        result.length
      );
    } finally {
      setLoading(false);
    }
  };

  const toggle = async () => {
    if (!open && processes.length === 0) {
      await loadProcesses();
    }

    setOpen((value) => !value);
  };

  const saveProcess = async (
    data: Partial<Process>
  ) => {
    if (
      modal?.mode === "edit" &&
      modal.process
    ) {
      const updated =
        await api.updateProcess(
          modal.process.id,
          data
        );

      setProcesses((current) =>
        current.map((item) =>
          item.id === updated.id
            ? updated
            : item
        )
      );
    } else {
      const created =
        await api.createProcess(
          clientId,
          department.department_id,
          data
        );

      setProcesses((current) => [
        ...current,
        created,
      ]);

      onProcessCountChange(
        department.department_id,
        processes.length + 1
      );
    }
  };

  const deleteProcess = async (
    id: number
  ) => {
    const confirmed = window.confirm(
      "Delete this process?"
    );

    if (!confirmed) return;

    await api.deleteProcess(id);

    const next = processes.filter(
      (process) => process.id !== id
    );

    setProcesses(next);

    onProcessCountChange(
      department.department_id,
      next.length
    );
  };

  const flowProcesses = processes
    .filter(
      (process) =>
        process.type === "flow"
    )
    .sort(
      (a, b) =>
        (a.flow_order ?? 0) -
        (b.flow_order ?? 0)
    );

  const standaloneProcesses =
    processes.filter(
      (process) =>
        process.type === "standalone"
    );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-3">

          {open ? (
            <ChevronDown
              size={18}
              className="text-indigo-600"
            />
          ) : (
            <ChevronRight
              size={18}
              className="text-slate-400"
            />
          )}

          <div className="text-left">
            <p className="font-bold text-sm text-slate-900">
              {department.name}
            </p>

            {department.description && (
              <p className="text-xs text-slate-500 mt-1">
                {department.description}
              </p>
            )}
          </div>
        </div>

        <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-full">
          {department.process_count}{" "}
          {department.process_count === 1
            ? "process"
            : "processes"}
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-5">

          {loading ? (
            <div className="py-10 flex justify-center">
              <Loader2
                size={23}
                className="animate-spin text-indigo-500"
              />
            </div>
          ) : (
            <div className="space-y-6">

              {flowProcesses.length > 0 && (
                <section>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Flow Steps
                  </p>

                  <div className="space-y-2">
                    {flowProcesses.map(
                      (process, index) => (
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
                              flowProcesses.length -
                                1 && (
                              <div className="w-px flex-1 bg-indigo-100 my-1" />
                            )}
                          </div>

                          <div className="flex-1">
                            <ProcessCard
                              process={
                                process
                              }
                              onEdit={() =>
                                setModal({
                                  mode: "edit",
                                  process,
                                })
                              }
                              onDelete={() =>
                                deleteProcess(
                                  process.id
                                )
                              }
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </section>
              )}

              {standaloneProcesses.length >
                0 && (
                <section>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Standalone
                  </p>

                  <div className="space-y-2">
                    {standaloneProcesses.map(
                      (process) => (
                        <ProcessCard
                          key={process.id}
                          process={
                            process
                          }
                          onEdit={() =>
                            setModal({
                              mode: "edit",
                              process,
                            })
                          }
                          onDelete={() =>
                            deleteProcess(
                              process.id
                            )
                          }
                        />
                      )
                    )}
                  </div>
                </section>
              )}

              {processes.length === 0 && (
                <div className="text-center py-8">
                  <ClipboardIcon />

                  <p className="text-sm text-slate-400">
                    No processes yet.
                  </p>
                </div>
              )}

              <button
                onClick={() =>
                  setModal({
                    mode: "add",
                  })
                }
                className="w-full border-2 border-dashed border-indigo-200 hover:border-indigo-400 text-indigo-600 hover:text-indigo-700 rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-semibold transition"
              >
                <Plus size={16} />
                Add Process
              </button>
            </div>
          )}
        </div>
      )}

      {modal && (
        <ProcessModal
          initial={modal.process}
          onClose={() =>
            setModal(null)
          }
          onSave={saveProcess}
        />
      )}
    </div>
  );
}

function ClipboardIcon() {
  return (
    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 mx-auto mb-3 flex items-center justify-center">
      <Clock3 size={20} />
    </div>
  );
}

function CreateDepartmentPanel({
  departments,
  assigned,
  clientId,
  onAssigned,
}: {
  departments: Department[];
  assigned: ClientDepartment[];
  clientId: number;
  onAssigned: (
    department: ClientDepartment
  ) => void;
}) {
  const [name, setName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [creating, setCreating] =
    useState(false);

  const [error, setError] =
    useState("");

  const assignedIds = new Set(
    assigned.map(
      (department) =>
        department.department_id
    )
  );

  const available = departments.filter(
    (department) =>
      !assignedIds.has(department.id)
  );

  const createAndAssign = async () => {
    if (!name.trim()) {
      setError(
        "Department name is required."
      );
      return;
    }

    setCreating(true);
    setError("");

    try {
      const department =
        await api.createDepartment(
          name.trim(),
          description.trim() ||
            undefined
        );

      await api.assignDepartment(
        clientId,
        department.id
      );

      const updated =
        await api.getClientDepartments(
          clientId
        );

      const createdAssignment =
        updated.find(
          (item) =>
            item.department_id ===
            department.id
        );

      if (createdAssignment) {
        onAssigned(
          createdAssignment
        );
      }

      setName("");
      setDescription("");
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to create department."
      );
    } finally {
      setCreating(false);
    }
  };

  const assignExisting = async (
    departmentId: number
  ) => {
    try {
      await api.assignDepartment(
        clientId,
        departmentId
      );

      const updated =
        await api.getClientDepartments(
          clientId
        );

      const assignment =
        updated.find(
          (item) =>
            item.department_id ===
            departmentId
        );

      if (assignment) {
        onAssigned(assignment);
      }
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to assign department."
      );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">

      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <Plus size={16} />
        </div>

        <div>
          <h3 className="font-bold text-sm text-slate-900">
            Add Department
          </h3>

          <p className="text-xs text-slate-500">
            Assign an existing department or create one.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-xs">
          {error}
        </div>
      )}

      {available.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-slate-500 mb-2">
            Existing Departments
          </p>

          <div className="flex flex-wrap gap-2">
            {available.map(
              (department) => (
                <button
                  key={department.id}
                  onClick={() =>
                    assignExisting(
                      department.id
                    )
                  }
                  className="px-3 py-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-xs font-medium text-slate-700 transition"
                >
                  {department.name}
                </button>
              )
            )}
          </div>
        </div>
      )}

      <div className="border-t border-slate-100 pt-5">

        <p className="text-xs font-semibold text-slate-500 mb-3">
          Create New Department
        </p>

        <div className="grid sm:grid-cols-2 gap-3">

          <input
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            placeholder="Department name"
            className="input"
          />

          <input
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
            placeholder="Description (optional)"
            className="input"
          />
        </div>

        <button
          onClick={createAndAssign}
          disabled={creating}
          className="mt-3 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold flex items-center gap-2"
        >
          {creating && (
            <Loader2
              size={15}
              className="animate-spin"
            />
          )}

          <Plus size={15} />
          Create & Assign
        </button>
      </div>
    </div>
  );
}

export default function ClientPage() {
  const [client, setClient] =
    useState<Client | null>(null);

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [clientDepartments, setClientDepartments] =
    useState<ClientDepartment[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showDepartmentForm, setShowDepartmentForm] =
    useState(false);

  useEffect(() => {
    loadClient();
  }, []);

  const loadClient = async () => {
    setLoading(true);
    setError("");

    try {
      const user = await api.me();

      if (user.role !== "client") {
        window.location.href = "/admin";
        return;
      }

      if (!user.client_id) {
        throw new Error(
          "Your account is not linked to a client."
        );
      }

      const [
        clientData,
        departmentData,
        clientDepartmentData,
      ] = await Promise.all([
        api.getClient(user.client_id),
        api.getDepartments(),
        api.getClientDepartments(
          user.client_id
        ),
      ]);

      setClient(clientData);
      setDepartments(departmentData);
      setClientDepartments(
        clientDepartmentData
      );
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to load client portal."
      );
    } finally {
      setLoading(false);
    }
  };

  const updateProcessCount = (
    departmentId: number,
    count: number
  ) => {
    setClientDepartments(
      (current) =>
        current.map((department) =>
          department.department_id ===
          departmentId
            ? {
                ...department,
                process_count:
                  count,
              }
            : department
        )
    );
  };

  const totalProcesses = useMemo(
    () =>
      clientDepartments.reduce(
        (sum, department) =>
          sum + department.process_count,
        0
      ),
    [clientDepartments]
  );

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2
          size={30}
          className="animate-spin text-indigo-500"
        />
      </main>
    );
  }

  if (error || !client) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-md text-center">
          <AlertCircle
            size={40}
            className="mx-auto text-red-400 mb-4"
          />

          <h2 className="font-bold text-slate-900">
            Unable to load portal
          </h2>

          <p className="text-sm text-red-600 mt-2">
            {error}
          </p>

          <button
            onClick={() =>
              api.logout()
            }
            className="mt-5 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm"
          >
            Back to Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">

      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Building2 size={20} />
            </div>

            <div>
              <h1 className="font-bold text-slate-900">
                Client Portal
              </h1>

              <p className="text-xs text-slate-500">
                Manage your departments and processes
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              api.logout()
            }
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

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 mb-6">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">

            <div className="flex items-center gap-4">

              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 text-xl font-bold">
                {client.name
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
                  Your Organization
                </p>

                <h2 className="text-2xl font-bold text-slate-900 mt-1">
                  {client.name}
                </h2>

                {client.email && (
                  <p className="text-sm text-slate-500 mt-1">
                    {client.email}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">

              <SummaryCard
                value={
                  clientDepartments.length
                }
                label="Departments"
              />

              <SummaryCard
                value={totalProcesses}
                label="Processes"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Departments & Processes
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Manage the processes associated with your organization.
            </p>
          </div>

          <button
            onClick={() =>
              setShowDepartmentForm(
                (value) => !value
              )
            }
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold"
          >
            <Plus size={16} />
            Add Department
          </button>
        </div>

        {showDepartmentForm && (
          <div className="mb-5">
            <CreateDepartmentPanel
              departments={departments}
              assigned={clientDepartments}
              clientId={client.id}
              onAssigned={(department) => {
                setClientDepartments(
                  (current) => [
                    ...current,
                    department,
                  ]
                );

                setShowDepartmentForm(
                  false
                );
              }}
            />
          </div>
        )}

        {clientDepartments.length ===
        0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl py-16 text-center">

            <Building2
              size={38}
              className="mx-auto text-slate-300 mb-3"
            />

            <h3 className="font-semibold text-slate-700">
              No departments yet
            </h3>

            <p className="text-sm text-slate-400 mt-1">
              Add a department to start creating processes.
            </p>

            <button
              onClick={() =>
                setShowDepartmentForm(
                  true
                )
              }
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold"
            >
              <Plus size={15} />
              Add Department
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {clientDepartments.map(
              (department) => (
                <DepartmentPanel
                  key={
                    department.client_department_id
                  }
                  clientId={client.id}
                  department={department}
                  onProcessCountChange={
                    updateProcessCount
                  }
                />
              )
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function SummaryCard({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="min-w-[100px] bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-center">
      <p className="text-xl font-bold text-slate-900">
        {value}
      </p>

      <p className="text-[11px] text-slate-500 mt-1">
        {label}
      </p>
    </div>
  );
}