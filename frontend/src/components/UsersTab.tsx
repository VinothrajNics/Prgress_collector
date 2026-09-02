'use client';

import { useCallback, useEffect, useState } from 'react';
import { useApp } from '@/store/AppContext';
import { api } from '@/lib/api';
import { ROLE_LABELS } from '@/lib/constants';
import { esc } from '@/lib/utils';
import type { WorkspaceUser } from '@/lib/types';

interface FormState {
  mode: 'new' | 'edit';
  user?: WorkspaceUser;
  name: string;
  username: string;
  password: string;
  role: string;
  departmentIds: string[];
}

export default function UsersTab() {
  const { state, role, user: me, scopeClientId, toast, clientNameOf } = useApp();
  const depts = state.org.departments;
  const isAdminRole = role === 'admin';

  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [loadedUsers, setLoadedUsers] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [busy, setBusy] = useState(false);

  const loadUsers = useCallback(() => {
    setLoadedUsers(false);
    api
      .listUsers(isAdminRole ? scopeClientId : undefined)
      .then((r) => setUsers(r.list || []))
      .catch((e) => toast(e.message || 'Failed to load users', true))
      .finally(() => setLoadedUsers(true));
  }, [isAdminRole, scopeClientId, toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const newUser = () => {
    setForm({
      mode: 'new',
      name: '',
      username: '',
      password: '',
      role: isAdminRole ? 'department' : 'department',
      departmentIds: [],
    });
  };

  const editUser = (u: WorkspaceUser) => {
    setForm({
      mode: 'edit',
      user: u,
      name: u.name,
      username: u.username,
      password: '',
      role: u.role,
      departmentIds: [...u.departmentIds],
    });
  };

  const submit = async () => {
    if (!form) return;
    const body: Record<string, unknown> = {
      name: form.name.trim(),
      email: '',
      role: form.role,
      departmentIds: form.departmentIds,
    };
    if (form.mode === 'new') {
      if (!form.username.trim()) return toast('Username is required', true);
      if (form.password.length < 4) return toast('Password must be at least 4 characters', true);
      body.username = form.username.trim().toLowerCase();
      body.password = form.password;
    } else {
      if (form.password) body.password = form.password;
    }
    if (!body.name) return toast('Name is required', true);
    if (form.role === 'department' && form.departmentIds.length === 0) {
      return toast('Assign at least one department for this login', true);
    }
    setBusy(true);
    try {
      if (form.mode === 'new') {
        await api.createUser(body, isAdminRole ? scopeClientId : undefined);
        toast('Login created');
      } else {
        await api.updateUser(form.user!.id, body, isAdminRole ? scopeClientId : undefined);
        toast('Login updated');
      }
      setForm(null);
      loadUsers();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Save failed', true);
    } finally {
      setBusy(false);
    }
  };

  const removeUser = async (u: WorkspaceUser) => {
    if (u.id === me?.id) return toast('You cannot delete your own login', true);
    if (!window.confirm('Delete login "' + u.username + '"? This cannot be undone.')) return;
    try {
      await api.deleteUser(u.id, isAdminRole ? scopeClientId : undefined);
      toast('Login deleted');
      loadUsers();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Delete failed', true);
    }
  };

  const canManage = (u: WorkspaceUser) => role === 'admin' || u.role === 'department';

  const toggleDept = (id: string) => {
    setForm((f) => {
      if (!f) return f;
      const cur = f.departmentIds;
      return {
        ...f,
        departmentIds: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
      };
    });
  };

  return (
    <section className="tab-panel active">
      <div className="banner">
        Company: <b>{clientNameOf(scopeClientId)}</b>. Create and manage login accounts for this company&apos;s
        departments here. A <b>Department login</b> can only view and work inside the departments you assign to it.
      </div>
      <div className="toolbar">
        <button className="btn" onClick={newUser} disabled={depts.length === 0}>
          + Add Login
        </button>
        {depts.length === 0 && (
          <span className="hint" style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
            Add at least one Department (Department tab) before creating a department login.
          </span>
        )}
        <div className="spacer"></div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Role</th>
              <th>Assigned Departments</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {!loadedUsers ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">Loading logins…</div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    No logins yet.{' '}
                    <button className="btn sm" onClick={newUser} disabled={depts.length === 0}>
                      + Add Login
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <b>{esc(u.name || '-')}</b>
                  </td>
                  <td>{esc(u.username)}</td>
                  <td>
                    <span className={`badge ${u.role === 'client' ? 'ok' : 'neutral'}`}>{ROLE_LABELS[u.role] || u.role}</span>
                  </td>
                  <td>
                    {u.role === 'department'
                      ? u.departmentIds
                          .map((id) => depts.find((d) => d.id === id)?.name || '?')
                          .join(', ') || '-'
                      : 'All departments'}
                  </td>
                  <td>
                    <span className={`badge ${u.status === 'Active' ? 'ok' : 'high'}`}>{esc(u.status || '-')}</span>
                  </td>
                  <td>
                    {canManage(u) && u.id !== me?.id && (
                      <>
                        <button className="icon-btn" title="Edit" onClick={() => editUser(u)}>
                          &#9998;
                        </button>
                        <button
                          className="icon-btn"
                          title="Delete"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => removeUser(u)}
                        >
                          &#128465;
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="modal-overlay open">
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3>{form.mode === 'new' ? 'Add Login' : 'Edit Login — ' + form.user!.username}</h3>
              <button className="icon-btn" onClick={() => setForm(null)}>
                &#10005;
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label>Display Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => (f ? { ...f, name: e.target.value } : f))} />
              </div>
              {form.mode === 'new' && (
                <div className="form-row">
                  <label>Username (login id) *</label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm((f) => (f ? { ...f, username: e.target.value } : f))}
                  />
                </div>
              )}
              <div className="form-row">
                <label>{form.mode === 'new' ? 'Password *' : 'Reset password (leave blank to keep current)'}</label>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm((f) => (f ? { ...f, password: e.target.value } : f))}
                  placeholder={form.mode === 'new' ? 'min. 4 characters' : ''}
                />
              </div>
              <div className="form-row">
                <label>Role</label>
                {role === 'admin' ? (
                  <select value={form.role} onChange={(e) => setForm((f) => (f ? { ...f, role: e.target.value } : f))}>
                    <option value="department">Department login</option>
                    <option value="client">Client login (full company access)</option>
                  </select>
                ) : (
                  <input type="text" value="Department login (full access only to assigned departments)" disabled />
                )}
              </div>
              {form.role === 'department' && (
                <div className="form-row">
                  <label>Assign Departments *</label>
                  <div className="chip-list">
                    {depts.length === 0 ? (
                      <span className="field-hint">No departments available yet.</span>
                    ) : (
                      depts.map((d) => (
                        <span
                          key={d.id}
                          className={`chip ${form.departmentIds.includes(d.id) ? 'selected' : ''}`}
                          onClick={() => toggleDept(d.id)}
                        >
                          {d.name}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn ghost" onClick={() => setForm(null)}>
                Cancel
              </button>
              <button className="btn" onClick={submit} disabled={busy}>
                {busy ? 'Saving…' : form.mode === 'new' ? 'Create Login' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
