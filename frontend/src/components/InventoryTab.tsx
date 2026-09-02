'use client';

import { useMemo, useState } from 'react';
import { useApp } from '@/store/AppContext';
import { useUi } from './App';
import { evaluateRisks, highestSeverity } from '@/lib/reports';
import { esc, downloadBlob, uid } from '@/lib/utils';
import type { Dataset } from '@/lib/types';

export default function InventoryTab() {
  const { state, mutate, toast, canEdit, showCompany, clientNameOf } = useApp();
  const ui = useUi();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');

  const departments = state.org.departments;
  const datasets = state.inventory.datasets;

  const deptName = (id: string) => departments.find((d) => d.id === id)?.name || '-';
  const tpName = (id: string) => state.thirdParties.list.find((t) => t.id === id)?.vendor || '-';

  const rows = useMemo(() => {
    let r = datasets;
    if (search) r = r.filter((ds) => (ds.name + ' ' + (ds.purpose || '') + ' ' + (ds.system || '')).toLowerCase().includes(search.toLowerCase()));
    if (deptFilter) r = r.filter((ds) => ds.departmentId === deptFilter);
    if (riskFilter) r = r.filter((ds) => highestSeverity(evaluateRisks(ds, state.thirdParties.list)) === (riskFilter === 'Clean' ? 'Clean' : riskFilter));
    return r;
  }, [datasets, search, deptFilter, riskFilter, state.thirdParties.list]);

  const addDataset = () => {
    if (departments.length === 0) {
      toast('Add at least one Department first (Organisation Structure tab)', true);
      return;
    }
    ui.openModal('dataset', null, 'Add Data Inventory Record', (rec) => {
      rec.id = uid('ds');
      mutate('inventory', (inv) => ({ ...inv, datasets: [...inv.datasets, rec as unknown as Dataset] }));
      toast('Data inventory record added');
    });
  };

  const editDataset = (ds: Dataset) =>
    ui.openModal('dataset', ds, 'Edit Data Inventory Record', (rec) => {
      Object.assign(ds, rec);
      mutate('inventory', (inv) => ({ ...inv, datasets: inv.datasets.map((d) => (d.id === ds.id ? ds : d)) }));
      toast('Record updated');
    });

  const deleteDataset = (ds: Dataset) => {
    if (!window.confirm('Delete this data inventory record?')) return;
    mutate('inventory', (inv) => ({ ...inv, datasets: inv.datasets.filter((d) => d.id !== ds.id) }));
    toast('Record deleted');
  };

  const exportCsv = () => {
    if (datasets.length === 0) {
      toast('No records to export', true);
      return;
    }
    const headers = [
      'Name',
      'Department',
      'Principal Type',
      'Sensitivity',
      'Data Elements',
      'Purpose',
      'Purpose Documented',
      'Source',
      'System',
      'Storage Location',
      'Hosting Country',
      'Shared Externally',
      'Third Party',
      'Cross Border',
      'Destination Country',
      'Retention Period',
      'Retention Unit',
      'Disposal Method',
      'Owner',
      'Risk Findings',
    ];
    const csvRows = [headers.join(',')];
    datasets.forEach((ds) => {
      const findings = evaluateRisks(ds, state.thirdParties.list)
        .map((f) => f.sev + ': ' + f.text)
        .join(' | ');
      const line = [
        ds.name,
        deptName(ds.departmentId),
        ds.dataPrincipalType,
        ds.sensitivity,
        ds.dataElements,
        ds.purpose,
        ds.purposeDocumented,
        ds.source,
        ds.system,
        ds.storageLocation,
        ds.hostingCountry,
        ds.sharedExternally,
        tpName(ds.thirdPartyId),
        ds.crossBorder,
        ds.destinationCountry,
        ds.retentionPeriod,
        ds.retentionUnit,
        ds.disposalMethod,
        ds.owner,
        findings,
      ]
        .map((v) => '"' + String(v || '').replace(/"/g, '""') + '"')
        .join(',');
      csvRows.push(line);
    });
    downloadBlob(csvRows.join('\n'), 'NICS_DPDP_Data_Inventory.csv', 'text/csv');
  };

  return (
    <section className="tab-panel active">
      <div className="toolbar">
        {canEdit && (
          <button className="btn" onClick={addDataset}>
            + Add Data Inventory Record
          </button>
        )}
        <input
          type="text"
          placeholder="Search data set, purpose, system..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
          <option value="">All Risk Levels</option>
          <option value="High">High Risk Only</option>
          <option value="Medium">Medium Risk Only</option>
          <option value="Clean">No Findings</option>
        </select>
        <div className="spacer"></div>
        {canEdit && (
          <button className="btn secondary" onClick={exportCsv}>
            Export CSV
          </button>
        )}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {showCompany && <th>Company</th>}
              <th>Data Set</th>
              <th>Department</th>
              <th>Principal</th>
              <th>Sensitivity</th>
              <th>Purpose Doc.</th>
              <th>Cross-Border</th>
              <th>Retention</th>
              <th>Risk</th>
              {canEdit && <th></th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={(showCompany ? 1 : 0) + 8 + (canEdit ? 1 : 0)}>
                  <div className="empty-state">
                    No data inventory records match.{' '}
                    {canEdit && (
                      <button className="btn sm" onClick={addDataset}>
                        + Add Record
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((ds) => {
                const findings = evaluateRisks(ds, state.thirdParties.list);
                const sev = highestSeverity(findings);
                const badgeClass = sev === 'High' ? 'high' : sev === 'Medium' ? 'medium' : 'ok';
                return (
                  <tr key={ds.id}>
                    {showCompany && <td>{esc(clientNameOf((ds as { clientId?: string }).clientId || ''))}</td>}
                    <td>
                      <b>{esc(ds.name)}</b>
                    </td>
                    <td>{deptName(ds.departmentId)}</td>
                    <td>{esc(ds.dataPrincipalType || '-')}</td>
                    <td>{esc(ds.sensitivity || '-')}</td>
                    <td>
                      {ds.purposeDocumented === 'Yes' ? <span className="badge ok">Yes</span> : <span className="badge high">No</span>}
                    </td>
                    <td>{ds.crossBorder === 'Yes' ? <span className="badge medium">Yes</span> : 'No'}</td>
                    <td>
                      {ds.retentionPeriod ? (
                        ds.retentionPeriod + ' ' + (ds.retentionUnit || '')
                      ) : (
                        <span className="badge high">Not set</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${badgeClass}`}>
                        {sev === 'Clean' ? 'No findings' : sev + ' (' + findings.length + ')'}
                      </span>
                    </td>
                    {canEdit && (
                      <td>
                        <button className="icon-btn" title="Edit" onClick={() => editDataset(ds)}>
                          &#9998;
                        </button>
                        <button
                          className="icon-btn"
                          title="Delete"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => deleteDataset(ds)}
                        >
                          &#128465;
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
