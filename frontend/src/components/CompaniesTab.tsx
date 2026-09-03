'use client';

import { useCallback, useEffect, useState } from 'react';
import { useApp } from '@/store/AppContext';
import { useUi } from './App';
import { api } from '@/lib/api';
import type { ClientSummary } from '@/lib/types';

const esc = (v: unknown) => (v === undefined || v === null ? '' : String(v));

interface CompanyForm {
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  loginUsername: string;
  loginPassword: string;
  editId?: string;
}

export default function CompaniesTab() {
  const { toast, isAdmin, setScopeClientId, reload } = useApp();
  const ui = useUi();
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [form, setForm] = useState<CompanyForm | null>(null);
  const [busy, setBusy] = useState(false);

  const loadClients = useCallback(() => {
    api
      .listClients()
      .then((r) => setClients(r.list || []))
      .catch((e) => toast(e.message || 'Failed to load companies', true));
  }, [toast]);

  useEffect(() => {
    if (isAdmin) loadClients();
  }, [isAdmin, loadClients]);

  const openCompany = (id: string) => {
    setScopeClientId(id);
    ui.setTab('dashboard');
    toast('Opened company workspace');
  };

  const openUsers = (id: string) => {
    setScopeClientId(id);
    ui.setTab('users');
  };

  const openNew = () =>
    setForm({ companyName: '', contactName: '', contactEmail: '', contactPhone: '', loginUsername: '', loginPassword: '' });

  const openEdit = (c: ClientSummary) =>
    setForm({
      editId: c.id,
      companyName: c.companyName,
      contactName: c.contactName,
      contactEmail: c.contactEmail,
      contactPhone: c.contactPhone,
      loginUsername: '',
      loginPassword: '',
    });

  const saveCompany = async () => {
    if (!form) return;
    if (!form.companyName.trim()) return toast('Company name is required', true);
    setBusy(true);
    try {
      if (form.editId) {
        await api.updateClient(form.editId, {
          companyName: form.companyName.trim(),
          contactName: form.contactName.trim(),
          contactEmail: form.contactEmail.trim(),
          contactPhone: form.contactPhone.trim(),
        });
        toast('Company updated');
      } else {
        if (!form.loginUsername.trim()) return toast('A client login username is required', true);
        if (form.loginPassword.length < 4) return toast('Client login password must be at least 4 characters', true);
        await api.createClient({
          companyName: form.companyName.trim(),
          contactName: form.contactName.trim(),
          contactEmail: form.contactEmail.trim(),
          contactPhone: form.contactPhone.trim(),
          loginUsername: form.loginUsername.trim(),
          loginPassword: form.loginPassword,
        });
        toast('Company created with client login');
      }
      setForm(null);
      loadClients();
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Save failed', true);
    } finally {
      setBusy(false);
    }
  };

  const removeCompany = async (c: ClientSummary) => {
    if (!window.confirm('Delete company "' + c.companyName + '" and ALL its data and logins? This cannot be undone.')) return;
    try {
      await api.deleteClient(c.id);
      toast('Company deleted');
      loadClients();
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Delete failed', true);
    }
  };

  return (
    <section className="tab-panel active">
      <div className="banner">
        All client companies managed by NICS. Click <b>Open</b> to view and edit that company&apos;s workspace, or{' '}
        <b>Users</b> to manage its login accounts.
      </div>
      <div className="card">
        <div className="toolbar" style={{ marginBottom: 4 }}>
          <button className="btn" onClick={openNew}>
            + Add Company
          </button>
          <div className="spacer"></div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Contact Email</th>
                <th>Departments</th>
                <th>Processes</th>
                <th>Data Records</th>
                <th>Third Parties</th>
                <th>Logins</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state">No companies yet. Add the first company above.</div>
                  </td>
                </tr>
              ) : (
                clients.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <b>{esc(c.companyName)}</b>
                    </td>
                    <td>{esc(c.contactEmail || '-')}</td>
                    <td>{c.counts.departments}</td>
                    <td>{c.counts.processes}</td>
                    <td>{c.counts.datasets}</td>
                    <td>{c.counts.third_parties}</td>
                    <td>
                      {c.users}{' '}
                      <span className="hint">
                        ({c.clientLogins} client / {c.deptLogins} dept)
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${c.status === 'Active' ? 'ok' : 'high'}`}>{esc(c.status || '-')}</span>
                    </td>
                    <td>
                      <button className="btn sm" onClick={() => openCompany(c.id)}>
                        Open
                      </button>
                      <button className="btn sm secondary" style={{ marginLeft: 4 }} onClick={() => openUsers(c.id)}>
                        Users
                      </button>
                      <button className="icon-btn" title="Edit" onClick={() => openEdit(c)}>
                        &#9998;
                      </button>
                      <button className="icon-btn" title="Delete" style={{ color: 'var(--danger)' }} onClick={() => removeCompany(c)}>
                        &#128465;
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {form && <CompanyModal form={form} busy={busy} onClose={() => setForm(null)} onSave={saveCompany} onChange={setForm} />}
    </section>
  );
}

function CompanyModal({
  form,
  busy,
  onClose,
  onSave,
  onChange,
}: {
  form: CompanyForm;
  busy: boolean;
  onClose: () => void;
  onSave: () => void;
  onChange: (f: CompanyForm) => void;
}) {
  const isEdit = !!form.editId;
  const set = (k: keyof CompanyForm, v: string) => onChange({ ...form, [k]: v });
  return (
    <div className="modal-overlay open">
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Company' : 'Add Company'}</h3>
          <button className="icon-btn" onClick={onClose}>
            &#10005;
          </button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <label>Company Name *</label>
            <input type="text" value={form.companyName} onChange={(e) => set('companyName', e.target.value)} />
          </div>
          <div className="form-row">
            <label>Contact Person</label>
            <input type="text" value={form.contactName} onChange={(e) => set('contactName', e.target.value)} />
          </div>
          <div className="form-row">
            <label>Contact Email</label>
            <input type="text" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} />
          </div>
          <div className="form-row">
            <label>Contact Phone</label>
            <input type="text" value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} />
          </div>
          {!isEdit && (
            <>
              <div className="section-title" style={{ margin: '10px 0 4px' }}>
                Initial client login <span className="hint">the company uses to sign in</span>
              </div>
              <div className="form-row">
                <label>Username *</label>
                <input type="text" value={form.loginUsername} onChange={(e) => set('loginUsername', e.target.value)} />
              </div>
              <div className="form-row">
                <label>Password *</label>
                <input type="text" value={form.loginPassword} onChange={(e) => set('loginPassword', e.target.value)} />
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" onClick={onSave} disabled={busy}>
            {busy ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Company'}
          </button>
        </div>
      </div>
    </div>
  );
}
