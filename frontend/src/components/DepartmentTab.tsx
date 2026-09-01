'use client';

import { useMemo, useState } from 'react';
import { useApp } from '@/store/AppContext';
import { useUi } from './App';
import { uid } from '@/lib/utils';
import { esc } from '@/lib/utils';
import type { Department, OrgState } from '@/lib/types';

export default function DepartmentTab() {
  const { state, mutate, toast } = useApp();
  const ui = useUi();
  const [search, setSearch] = useState('');

  const departments = state.org.departments;
  const entityName = (id: string) => state.org.entities.find((e) => e.id === id)?.legalName || '';

  const updateOrg = (fn: (o: OrgState) => OrgState) => mutate('org', fn);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return departments;
    return departments.filter((d) =>
      [d.name, d.headContact, d.headDesignation, d.location, d.headEmail].filter(Boolean).join(' ').toLowerCase().includes(q)
    );
  }, [departments, search]);

  const renderSeedChips = () =>
    state.settings.departmentSeedOptions.map((opt) => (
      <span key={opt} className="chip">
        <span className="chip-label">{opt}</span>
        <span
          className="chip-edit"
          title="Rename"
          style={{ opacity: 0.6, fontSize: 11 }}
          onClick={() => renameSeed(opt)}
        >
          &#9998;
        </span>
        <span className="chip-x" title="Remove" onClick={() => removeSeed(opt)}>
          &times;
        </span>
      </span>
    ));

  const renameSeed = (oldName: string) => {
    const newName = window.prompt('Rename standard department:', oldName);
    if (newName === null) return;
    const trimmed = newName.trim();
    if (!trimmed) return;
    const idx = state.settings.departmentSeedOptions.findIndex((o) => o === oldName);
    if (idx > -1) {
      if (state.settings.departmentSeedOptions.some((o, i) => i !== idx && o.toLowerCase() === trimmed.toLowerCase())) {
        toast('That name already exists in the list', true);
        return;
      }
      mutate('settings', (s) => {
        const opts = [...s.departmentSeedOptions];
        opts[idx] = trimmed;
        return { ...s, departmentSeedOptions: opts };
      });
      toast('Standard department renamed');
    }
  };

  const removeSeed = (name: string) => {
    if (!window.confirm('Remove "' + name + '" from the standard department list?')) return;
    mutate('settings', (s) => ({ ...s, departmentSeedOptions: s.departmentSeedOptions.filter((o) => o !== name) }));
  };

  const addSeed = (val: string) => {
    const v = val.trim();
    if (!v) return;
    if (state.settings.departmentSeedOptions.some((o) => o.toLowerCase() === v.toLowerCase())) {
      toast('Already in the list', true);
      return;
    }
    mutate('settings', (s) => ({ ...s, departmentSeedOptions: [...s.departmentSeedOptions, v] }));
    toast('Added to standard department list');
  };

  const addDepartment = () =>
    ui.openModal('department', null, 'Add Department', (rec) => {
      rec.id = uid('dep');
      updateOrg((o) => ({ ...o, departments: [...o.departments, rec as unknown as Department] }));
      toast('Department added');
    });

  const addStandardDepts = () => {
    const existing = departments.map((d) => d.name.toLowerCase());
    const newDepts = state.settings.departmentSeedOptions
      .filter((name) => !existing.includes(name.toLowerCase()))
      .map((name) => ({
        id: uid('dep'),
        entityId: '',
        name,
        headContact: '',
        headDesignation: '',
        headEmail: '',
        headPhone: '',
        location: '',
        criticality: 'Medium',
        employeeCount: '',
        status: 'Active',
        personalDataCollected: [] as string[],
        mediumOfCollection: [] as string[],
        retentionYears: '',
        retentionMonths: '',
        deviceUsed: '',
      }));
    if (newDepts.length) {
      updateOrg((o) => ({ ...o, departments: [...o.departments, ...newDepts] }));
      toast(newDepts.length + ' standard department(s) added');
    } else {
      toast('All standard departments already exist');
    }
  };

  const editDepartment = (dep: Department) =>
    ui.openModal('department', dep, 'Edit Department', (rec) => {
      Object.assign(dep, rec);
      updateOrg((o) => ({ ...o }));
      toast('Department updated');
    });

  const deleteDepartment = (dep: Department) => {
    if (!window.confirm('Delete this Department and everything under it (processes, activities, linked data inventory records)?')) return;
    const procIds = state.org.processes.filter((p) => p.departmentId === dep.id).map((p) => p.id);
    updateOrg((o) => ({
      ...o,
      departments: o.departments.filter((x) => x.id !== dep.id),
      processes: o.processes.filter((x) => !procIds.includes(x.id)),
      activities: o.activities.filter((a) => !procIds.includes(a.processId)),
    }));
    mutate('inventory', (inv) => ({ ...inv, datasets: inv.datasets.filter((ds) => ds.departmentId !== dep.id) }));
    toast('Department deleted');
  };

  return (
    <section className="tab-panel active">
      <div className="toolbar">
        <button className="btn" onClick={addDepartment}>
          + Add Department
        </button>
        <button className="btn secondary" onClick={addStandardDepts}>
          + Add Standard Departments
        </button>
        <div className="spacer"></div>
        <input
          type="text"
          placeholder="Search department, head, location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: 'var(--navy)', fontSize: 14 }}>
          Standard Department List{' '}
          <span className="hint" style={{ fontWeight: 400, fontSize: '11.5px', color: 'var(--muted)' }}>
            (used by &quot;+ Add Standard Departments&quot; and as name suggestions &mdash; add, rename or remove entries here)
          </span>
        </h3>
        <div className="chip-list">{renderSeedChips()}</div>
        <SeedAddRow onAdd={addSeed} />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Department</th>
              <th>Legal Entity</th>
              <th>Head Name</th>
              <th>Designation</th>
              <th>Contact No.</th>
              <th>Email</th>
              <th>Employees</th>
              <th>Location</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10}>
                  <div className="empty-state">
                    No departments yet. Use &quot;+ Add Department&quot; or &quot;+ Add Standard Departments&quot; above.
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((d) => (
                <tr key={d.id}>
                  <td>
                    <a
                      href="#"
                      className="dept-name-link"
                      onClick={(e) => {
                        e.preventDefault();
                        ui.openDeptProcess(d);
                      }}
                    >
                      {esc(d.name)}
                    </a>
                  </td>
                  <td>{esc(d.entityId ? entityName(d.entityId) : 'Unassigned')}</td>
                  <td>{esc(d.headContact || '-')}</td>
                  <td>{esc(d.headDesignation || '-')}</td>
                  <td>{esc(d.headPhone || '-')}</td>
                  <td>{esc(d.headEmail || '-')}</td>
                  <td>{esc(d.employeeCount || '-')}</td>
                  <td>{esc(d.location || '-')}</td>
                  <td>
                    <span className={`badge ${d.status === 'Active' ? 'ok' : 'neutral'}`}>{esc(d.status || '-')}</span>
                  </td>
                  <td>
                    <button className="icon-btn" title="Process Register" onClick={() => ui.openDeptProcess(d)}>
                      &#128203;
                    </button>
                    <button className="icon-btn" title="Data Profile" onClick={() => ui.openDataProfile(d)}>
                      &#128202;
                    </button>
                    <button className="icon-btn" title="Edit" onClick={() => editDepartment(d)}>
                      &#9998;
                    </button>
                    <button
                      className="icon-btn"
                      title="Delete"
                      style={{ color: 'var(--danger)' }}
                      onClick={() => deleteDepartment(d)}
                    >
                      &#128465;
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SeedAddRow({ onAdd }: { onAdd: (val: string) => void }) {
  const [val, setVal] = useState('');
  return (
    <div className="chip-add-row" style={{ maxWidth: 420 }}>
      <input
        type="text"
        placeholder="Add a new standard department..."
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onAdd(val);
            setVal('');
          }
        }}
      />
      <button
        className="btn sm secondary"
        onClick={() => {
          onAdd(val);
          setVal('');
        }}
      >
        + Add
      </button>
    </div>
  );
}
