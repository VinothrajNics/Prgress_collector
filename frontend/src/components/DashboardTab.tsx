'use client';

import { useMemo } from 'react';
import { useApp } from '@/store/AppContext';
import { useUi } from './App';
import { evaluateRisks, highestSeverity } from '@/lib/reports';
import { esc } from '@/lib/utils';
import type { Dataset } from '@/lib/types';

export default function DashboardTab() {
  const { state, mutate, toast } = useApp();
  const ui = useUi();
  const { org, inventory, thirdParties } = state;
  const inv = inventory.datasets;

  const deptName = (id: string) => {
    const d = state.org.departments.find((x) => x.id === id);
    return d ? d.name : '-';
  };

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
        const n = deptName(ds.departmentId);
        byDept[n] = (byDept[n] || 0) + 1;
      }
    });
    return Object.entries(byDept).sort((a, b) => b[1] - a[1]);
  }, [inv, org.departments]);

  const cards = [
    { n: org.groups.length, l: 'Groups' },
    { n: org.entities.length, l: 'Legal Entities' },
    { n: org.departments.length, l: 'Departments' },
    { n: org.processes.length, l: 'Processes' },
    { n: inv.length, l: 'Data Inventory Records' },
    { n: thirdParties.list.length, l: 'Third Parties' },
    { n: stats.completeness + '%', l: 'Discovery Completeness', cls: '' },
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

  const max = deptChart.length ? Math.max(...deptChart.map((e) => e[1])) : 0;

  return (
    <section className="tab-panel active">
      <div className="banner">
        This workspace maps your organisation&apos;s personal data footprint end-to-end &mdash; from group structure
        down to individual data elements &mdash; and flags DPDP compliance gaps automatically as you add information.
      </div>
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
              <th>Severity</th>
              <th>Finding</th>
              <th>Data Set</th>
              <th>Department</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {stats.allFindings.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    No risk findings yet. Add Data Inventory records to see automated DPDP gap analysis here.
                  </div>
                </td>
              </tr>
            ) : (
              stats.allFindings.map((f, i) => (
                <tr key={i}>
                  <td>
                    <span className={`badge ${f.sev === 'High' ? 'high' : 'medium'}`}>{f.sev}</span>
                  </td>
                  <td>{f.text}</td>
                  <td>{esc(f.ds.name)}</td>
                  <td>{esc(deptName(f.ds.departmentId))}</td>
                  <td>
                    <button className="btn sm secondary" onClick={() => openEdit(f.ds)}>
                      Open
                    </button>
                  </td>
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
              <div style={{ width: 140, fontSize: 12, color: 'var(--navy)', fontWeight: 600 }}>{esc(name)}</div>
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
