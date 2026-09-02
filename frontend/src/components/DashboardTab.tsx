'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '@/store/AppContext';
import { useUi } from './App';
import { evaluateRisks, highestSeverity } from '@/lib/reports';
import { api } from '@/lib/api';
import { esc } from '@/lib/utils';
import type { ClientSummary, Dataset } from '@/lib/types';

interface CompanyForm {
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  loginUsername: string;
  loginPassword: string;
  editId?: string;
}

export default function DashboardTab() {
  const { state, mutate, toast, canEdit, showCompany, clientNameOf, isAdmin, scopeClientId, setScopeClientId, reload } = useApp();
  const ui = useUi();
  const { org, inventory, thirdParties } = state;
  const inv = inventory.datasets;

  const deptName = (id: string) => {
    const d = state.org.departments.find((x) => x.id === id);
    return d ? d.name : '-';
  };

  const companyLabel = (clientId?: string) => (showCompany ? clientNameOf(clientId || '') : '');

  const stats = useMemo(() => {
    let high = 0;
    let med = 0;
    let clean = 0;
    const allFindings: { sev: string; text: string; ds: Dataset }[] = [];
    inv.forEach((ds) => {
      const f = evaluateRisks(ds, thirdParties.list);
      const sev = highestSeverity(f);
      if (sev === 'High') high++;
      else if (sev === 'Medium') med++;
      else clean++;
      f.forEach((item) => allFindings.push({ ...item, ds }));
    });
    const completeness = inv.length ? Math.round((clean / inv.length) * 100) : 0;
    return {
      high,
      med,
      clean,
      completeness,
      allFindings: allFindings.sort((a, b) => (a.sev === 'High' ? 0 : 1) - (b.sev === 'High' ? 0 : 1)),
    };
  }, [inv, thirdParties.list]);

  const deptChart = useMemo(() => {
    const byDept: Record<string, number> = {};
    inv.forEach((ds) => {
      if (ds.personalData === 'Yes') {
        const prefix = companyLabel((ds as { clientId?: string }).clientId);
        const label = prefix ? prefix + ' / ' + deptName(ds.departmentId) : deptName(ds.departmentId);
        byDept[label] = (byDept[label] || 0) + 1;
      }
    });
    return Object.entries(byDept).sort((a, b) => b[1] - a[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inv, org.departments, showCompany, state.clients]);

  const cards = [
    { n: org.groups.length, l: 'Groups' },
    { n: org.entities.length, l: 'Legal Entities' },
    { n: org.departments.length, l: 'Departments' },
    { n: org.processes.length, l: 'Processes' },
    { n: inv.length, l: 'Data Inventory Records' },
    { n: thirdParties.list.length, l: 'Third Parties' },
    { n: stats.completeness + '%', l: 'Discovery Completeness' },
    { n: stats.high, l: 'High Risk Findings', cls: 'risk-high' },
  ];

  const openEdit = (ds: Dataset) => {
    ui.setTab('inventory');
    ui.openModal('dataset', ds, 'Edit Data Inventory Record', (rec) => {
      Object.assign(ds, rec);
      mutate('inventory', (invState) => ({ ...invState, datasets: invState.datasets.map((d) => (d.id === ds.id ? ds : d)) }));
      toast('Record updated');
    });
  };

  /* ---- Admin "all companies" overview ---- */
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [form, setForm] = useState<CompanyForm | null>(null);
  const [busy, setBusy] = useState(false);

  const loadClients = useCallback(() => {
    if (!isAdmin) return;
    api
      .listClients()
      .then((r) => setClients(r.list || []))
      .catch((e) => toast(e.message || 'Failed to load companies', true));
  }, [isAdmin, toast]);

  useEffect(() => {
    if (isAdmin && showCompany) loadClients();
  }, [isAdmin, showCompany, scopeClientId, loadClients]);

  const openCompany = (id: string) => {
    setScopeClientId(id);
    toast('Opened company workspace');
  };

  const openUsers = (id: string) => {
    setScopeClientId(id);
    ui.setTab('users');
  };

  const openNew = () =>
    setForm({ companyName: '', contactName: '', contactEmail: '', contactPhone: '', loginUsername: '', loginPassword: '' });

  const openEditCompany = (c: ClientSummary) =>
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

  const max = deptChart.length ? Math.max(...deptChart.map((e) => e[1])) : 0;

  return (
    <section className="tab-panel active">
      {showCompany && (
        <>
          <div className="section-title" style={{ marginTop: 0 }}>
            Companies <span className="hint">All client companies managed by NICS</span>
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="toolbar" style={{ marginBottom: 4 }}>
              <button className="btn" onClick={openNew}>
                + Add Company
              </button>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Filter:</span>
              <select
                className="company-switch"
                value={scopeClientId}
                onChange={(e) => {
                  setScopeClientId(e.target.value);
                  if (e.target.value) toast('Opened company workspace');
                }}
                title="Scope every page to one company, or keep showing all companies"
              >
                <option value="">All companies (aggregate view)</option>
                {state.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
              <div className="spacer"></div>
              <span className="hint">
                Tip: choose a company in the <b>Company filter</b> (top right) to view and edit that company&apos;s full
                workspace in these pages.
              </span>
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
                          {c.users} <span className="hint">({c.clientLogins} client / {c.deptLogins} dept)</span>
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
                          <button className="icon-btn" title="Edit" onClick={() => openEditCompany(c)}>
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
        </>
      )}

      {!showCompany && (
        <div className="banner">
          {scopeClientId ? (
            <>
              Viewing workspace for <b>{clientNameOf(scopeClientId)}</b>. This maps your organisation&apos;s personal
              data footprint end-to-end &mdash; from group structure down to individual data elements &mdash; and flags
              DPDP compliance gaps automatically.
            </>
          ) : (
            'This workspace maps your organisation\'s personal data footprint end-to-end — from group structure down to individual data elements — and flags DPDP compliance gaps automatically as you add information.'
          )}
        </div>
      )}

      <div className="grid grid-4">
        {cards.map((c, i) => (
          <div key={i} className={`card stat-card ${c.cls || ''}`}>
            <div className="stat-num">{c.n}</div>
            <div className="stat-label">{c.l}</div>
          </div>
        ))}
      </div>

      <div className="section-title">
        Risk Findings <span className="hint">Auto-generated from Data Inventory records</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {showCompany && <th>Company</th>}
              <th>Severity</th>
              <th>Finding</th>
              <th>Data Set</th>
              <th>Department</th>
              {canEdit && <th></th>}
            </tr>
          </thead>
          <tbody>
            {stats.allFindings.length === 0 ? (
              <tr>
                <td colSpan={(showCompany ? 1 : 0) + 4 + (canEdit ? 1 : 0)}>
                  <div className="empty-state">
                    No risk findings yet. Add Data Inventory records to see automated DPDP gap analysis here.
                  </div>
                </td>
              </tr>
            ) : (
              stats.allFindings.map((f, i) => (
                <tr key={i}>
                  {showCompany && <td>{esc(companyLabel((f.ds as { clientId?: string }).clientId))}</td>}
                  <td>
                    <span className={`badge ${f.sev === 'High' ? 'high' : 'medium'}`}>{f.sev}</span>
                  </td>
                  <td>{f.text}</td>
                  <td>{esc(f.ds.name)}</td>
                  <td>{deptName(f.ds.departmentId)}</td>
                  {canEdit && (
                    <td>
                      <button className="btn sm secondary" onClick={() => openEdit(f.ds)}>
                        Open
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="section-title">Personal Data by Department</div>
      <div className="card">
        {deptChart.length === 0 ? (
          <div className="empty-state">No personal-data records mapped to departments yet.</div>
        ) : (
          deptChart.map(([name, count]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 160, fontSize: 12, color: 'var(--navy)', fontWeight: 600 }}>{name}</div>
              <div style={{ flex: 1, background: 'var(--panel)', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${(count / max) * 100}%`,
                    background: 'linear-gradient(90deg,var(--teal),var(--royal))',
                    height: 16,
                  }}
                ></div>
              </div>
              <div style={{ width: 24, fontSize: 12, color: 'var(--muted)', textAlign: 'right' }}>{count}</div>
            </div>
          ))
        )}
      </div>
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
