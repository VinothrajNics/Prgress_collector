'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useApp } from '@/store/AppContext';
import { useUi } from './App';
import type { Entity, Group, OrgState, Process } from '@/lib/types';
import { uid, fmtDateTime } from '@/lib/utils';

function TreeItem({ node, children }: { node: ReactNode; children?: ReactNode }) {
  return <li>{node}{children ? <ul>{children}</ul> : null}</li>;
}

function TreeNode({
  tag,
  name,
  meta,
  onAdd,
  onEdit,
  onDelete,
  extra,
}: {
  tag: string;
  name: ReactNode;
  meta: ReactNode;
  onAdd?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  extra?: ReactNode;
}) {
  const tagLabel: Record<string, string> = { grp: 'Group', ent: 'Entity', dep: 'Dept', proc: 'Process', act: 'Activity' };
  return (
    <div className="tree-node">
      <span className={`tag ${tag}`}>{tagLabel[tag]}</span>
      <span className="name">{name}</span>
      <span className="meta">{meta}</span>
      <div className="tree-actions">
        {extra}
        {onAdd && (
          <button className="btn sm secondary" onClick={onAdd}>
            + Add Child
          </button>
        )}
        <button className="icon-btn" title="Edit" onClick={onEdit}>
          &#9998;
        </button>
        <button className="icon-btn" title="Delete" style={{ color: 'var(--danger)' }} onClick={onDelete}>
          &#128465;
        </button>
      </div>
    </div>
  );
}

export default function OrgTreeTab() {
  const { state, mutate, toast } = useApp();
  const ui = useUi();
  const [stamp] = useState(() => 'Last viewed: ' + fmtDateTime(new Date()));

  const { groups, entities, departments, processes, activities } = state.org;

  const groupName = (id: string) => groups.find((g) => g.id === id)?.name || '';
  const entityName = (id: string) => entities.find((e) => e.id === id)?.legalName || '';

  const updateOrg = (fn: (o: OrgState) => OrgState) => mutate('org', fn);
  const dropDatasets = (deptIds: string[]) =>
    mutate('inventory', (inv) => ({ ...inv, datasets: inv.datasets.filter((ds) => !deptIds.includes(ds.departmentId)) }));

  const deleteGroup = (g: Group) => {
    if (!window.confirm('Delete this Group and everything under it?')) return;
    const entityIds = entities.filter((e) => e.groupId === g.id).map((e) => e.id);
    const deptIds = departments.filter((d) => entityIds.includes(d.entityId)).map((d) => d.id);
    const procIds = processes.filter((p) => deptIds.includes(p.departmentId)).map((p) => p.id);
    updateOrg((o) => ({
      ...o,
      groups: o.groups.filter((x) => x.id !== g.id),
      entities: o.entities.filter((x) => !entityIds.includes(x.id)),
      departments: o.departments.filter((x) => !deptIds.includes(x.id)),
      processes: o.processes.filter((x) => !procIds.includes(x.id)),
      activities: o.activities.filter((a) => !procIds.includes(a.processId)),
    }));
    dropDatasets(deptIds);
    toast('Group deleted');
  };

  const deleteEntity = (ent: Entity) => {
    if (!window.confirm('Delete this Legal Entity and everything under it?')) return;
    const deptIds = departments.filter((d) => d.entityId === ent.id).map((d) => d.id);
    const procIds = processes.filter((p) => deptIds.includes(p.departmentId)).map((p) => p.id);
    updateOrg((o) => ({
      ...o,
      entities: o.entities.filter((x) => x.id !== ent.id),
      departments: o.departments.filter((x) => !deptIds.includes(x.id)),
      processes: o.processes.filter((x) => !procIds.includes(x.id)),
      activities: o.activities.filter((a) => !procIds.includes(a.processId)),
    }));
    dropDatasets(deptIds);
    toast('Entity deleted');
  };

  const deleteDepartment = (deptId: string) => {
    if (!window.confirm('Delete this Department and everything under it (processes, activities, linked data inventory records)?')) return;
    const procIds = processes.filter((p) => p.departmentId === deptId).map((p) => p.id);
    updateOrg((o) => ({
      ...o,
      departments: o.departments.filter((x) => x.id !== deptId),
      processes: o.processes.filter((x) => !procIds.includes(x.id)),
      activities: o.activities.filter((a) => !procIds.includes(a.processId)),
    }));
    dropDatasets([deptId]);
    toast('Department deleted');
  };

  const deleteProcess = (p: Process) => {
    if (!window.confirm('Delete this Process and its activities?')) return;
    updateOrg((o) => ({
      ...o,
      processes: o.processes.filter((x) => x.id !== p.id),
      activities: o.activities.filter((a) => a.processId !== p.id),
    }));
    toast('Process deleted');
  };

  const addStandardDepartments = (entityId: string) => {
    const existing = departments.filter((d) => d.entityId === entityId).map((d) => d.name.toLowerCase());
    let added = 0;
    const newDepts = state.settings.departmentSeedOptions
      .filter((name) => !existing.includes(name.toLowerCase()))
      .map((name) => ({
        id: uid('dep'),
        entityId,
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
      added = newDepts.length;
      toast(added + ' standard department(s) added');
    } else {
      toast('Standard departments already exist for this entity');
    }
  };

  const addGroup = () =>
    ui.openModal('group', null, 'Add Group', (rec) => {
      rec.id = uid('grp');
      updateOrg((o) => ({ ...o, groups: [...o.groups, rec as unknown as Group] }));
      toast('Group added');
    });

  const editGroup = (g: Group) =>
    ui.openModal('group', g, 'Edit Group', (rec) => {
      Object.assign(g, rec);
      updateOrg((o) => ({ ...o }));
      toast('Group updated');
    });

  const addEntity = (g: Group) =>
    ui.openModal('entity', null, 'Add Legal Entity', (rec) => {
      rec.id = uid('ent');
      rec.groupId = g.id;
      updateOrg((o) => ({ ...o, entities: [...o.entities, rec as unknown as Entity] }));
      toast('Legal entity added');
    });

  const editEntity = (ent: Entity) =>
    ui.openModal('entity', ent, 'Edit Legal Entity', (rec) => {
      Object.assign(ent, rec);
      updateOrg((o) => ({ ...o }));
      toast('Entity updated');
    });

  const addDepartment = (ent: Entity) =>
    ui.openModal('department', null, 'Add Department', (rec) => {
      rec.id = uid('dep');
      rec.entityId = ent.id;
      updateOrg((o) => ({ ...o, departments: [...o.departments, rec as unknown as typeof departments[number]] }));
      toast('Department added');
    });

  const editDepartment = (dep: typeof departments[number]) =>
    ui.openModal('department', dep, 'Edit Department', (rec) => {
      Object.assign(dep, rec);
      updateOrg((o) => ({ ...o }));
      toast('Department updated');
    });

  const addActivity = (p: Process) =>
    ui.openModal('activity', null, 'Add Activity', (rec) => {
      rec.id = uid('act');
      rec.processId = p.id;
      updateOrg((o) => ({ ...o, activities: [...o.activities, rec as never] }));
      toast('Activity added');
    });

  const editActivity = (act: typeof activities[number]) =>
    ui.openModal('activity', act, 'Edit Activity', (rec) => {
      Object.assign(act, rec);
      updateOrg((o) => ({ ...o }));
      toast('Activity updated');
    });

  const tree = useMemo(
    () =>
      groups.map((g) => {
        const grpMeta =
          `${g.hqCountry || '-'} · DPO: ${g.dpo || '-'}` +
          (g.parentGroupId ? ` · Parent: ${groupName(g.parentGroupId)} (${g.holdingPercent || '?'}% held)` : '');
        return (
          <TreeItem
            key={g.id}
            node={
              <TreeNode
                tag="grp"
                name={g.name}
                meta={grpMeta}
                onAdd={() => addEntity(g)}
                onEdit={() => editGroup(g)}
                onDelete={() => deleteGroup(g)}
              />
            }
          >
            {entities
              .filter((e) => e.groupId === g.id)
              .map((ent) => {
                const entMeta =
                  `${ent.country || '-'} · ${ent.industry || '-'}` +
                  (ent.parentEntityId ? ` · Parent: ${entityName(ent.parentEntityId)} (${ent.holdingPercent || '?'}% held)` : '');
                return (
                  <TreeItem
                    key={ent.id}
                    node={
                      <TreeNode
                        tag="ent"
                        name={ent.legalName}
                        meta={entMeta}
                        extra={
                          <button
                            className="btn sm ghost"
                            title="Add Administration, Human Resources, Accounts and Finance, Compliance"
                            onClick={() => addStandardDepartments(ent.id)}
                          >
                            + Standard Depts
                          </button>
                        }
                        onAdd={() => addDepartment(ent)}
                        onEdit={() => editEntity(ent)}
                        onDelete={() => deleteEntity(ent)}
                      />
                    }
                  >
                    {departments
                      .filter((d) => d.entityId === ent.id)
                      .map((dep) => {
                        const depMeta =
                          `Head: ${dep.headContact || '-'}${dep.headDesignation ? ' (' + dep.headDesignation + ')' : ''} · Contact: ${dep.headEmail || dep.headPhone || '-'} · Employees: ${dep.employeeCount || '-'} · Location: ${dep.location || '-'}`;
                        const procUl = processes.filter((p) => p.departmentId === dep.id).map((p) => {
                          const pMeta = `Owner: ${p.owner || '-'} · Software: ${(p.softwareList || []).join(', ') || '-'} · Storage: ${p.storageLocation || '-'}`;
                          const actUl = activities.filter((a) => a.processId === p.id).map((a) => (
                            <TreeItem
                              key={a.id}
                              node={
                                <TreeNode
                                  tag="act"
                                  name={a.name}
                                  meta={`Owner: ${a.owner || '-'} · ${a.frequency || '-'}`}
                                  onEdit={() => editActivity(a)}
                                  onDelete={() => {
                                    if (window.confirm('Delete this Activity?')) {
                                      updateOrg((o) => ({ ...o, activities: o.activities.filter((x) => x.id !== a.id) }));
                                    }
                                  }}
                                />
                              }
                            />
                          ));
                          return (
                            <TreeItem
                              key={p.id}
                              node={
                                <TreeNode
                                  tag="proc"
                                  name={p.name}
                                  meta={pMeta}
                                  onAdd={() => addActivity(p)}
                                  onEdit={() => ui.openProcessDetail(dep, p)}
                                  onDelete={() => deleteProcess(p)}
                                />
                              }
                            >
                              {actUl}
                            </TreeItem>
                          );
                        });
                        return (
                          <TreeItem
                            key={dep.id}
                            node={
                              <TreeNode
                                tag="dep"
                                name={
                                  <span
                                    className="dept-name-link"
                                    title="Click to open the Process Register for this department"
                                    onClick={() => ui.openDeptProcess(dep)}
                                  >
                                    {dep.name}
                                  </span>
                                }
                                meta={depMeta}
                                extra={
                                  <button
                                    className="btn sm secondary"
                                    title="Personal data collected, retention, medium & device"
                                    onClick={() => ui.openDataProfile(dep)}
                                  >
                                    &#128202; Data Profile
                                  </button>
                                }
                                onAdd={() => ui.openProcessDetail(dep)}
                                onEdit={() => editDepartment(dep)}
                                onDelete={() => deleteDepartment(dep.id)}
                              />
                            }
                          >
                            {procUl}
                          </TreeItem>
                        );
                      })}
                  </TreeItem>
                );
              })}
          </TreeItem>
        );
      }),
    [groups, entities, departments, processes, activities]
  );

  return (
    <section className="tab-panel active">
      <div className="toolbar">
        <button className="btn" onClick={addGroup}>
          + Add Group
        </button>
        <button className="btn secondary" onClick={() => ui.openPrint('org')}>
          &#128438; Print / Export PDF
        </button>
        <div className="spacer"></div>
        <span className="hint" style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
          Group &rarr; Legal Entity &rarr; Department &rarr; Process &rarr; Activity
        </span>
      </div>
      <div className="timestamp-line" style={{ marginBottom: 10 }}>
        {stamp}
      </div>
      {groups.length === 0 ? (
        <div className="empty-state">
          No groups yet. Start by adding your organisation&apos;s top-level Group.
          <br />
          <button className="btn" onClick={addGroup}>
            + Add Group
          </button>
        </div>
      ) : (
        <ul className="tree">{tree}</ul>
      )}
    </section>
  );
}
