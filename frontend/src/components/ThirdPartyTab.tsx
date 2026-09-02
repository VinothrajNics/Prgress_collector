'use client';

import { useApp } from '@/store/AppContext';
import { useUi } from './App';
import { esc, uid } from '@/lib/utils';
import type { ThirdParty } from '@/lib/types';

function makeCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return 'VND-' + s;
}

export default function ThirdPartyTab() {
  const { state, mutate, toast, canEdit, showCompany, clientNameOf } = useApp();
  const ui = useUi();
  const list = state.thirdParties.list;

  const addTP = () =>
    ui.openModal('thirdparty', null, 'Add Third Party / Vendor', (rec) => {
      rec.id = uid('tp');
      rec.code = makeCode();
      mutate('thirdParties', (t) => ({ ...t, list: [...t.list, rec as unknown as ThirdParty] }));
      toast('Third party added');
    });

  const editTP = (tp: ThirdParty) =>
    ui.openModal('thirdparty', tp, 'Edit Third Party / Vendor — ' + tp.vendor, (rec) => {
      Object.assign(tp, rec);
      mutate('thirdParties', (t) => ({ ...t, list: t.list.map((x) => (x.id === tp.id ? tp : x)) }));
      toast('Third party updated');
    });

  const deleteTP = (tp: ThirdParty) => {
    if (!window.confirm('Delete this third party?')) return;
    mutate('thirdParties', (t) => ({ ...t, list: t.list.filter((x) => x.id !== tp.id) }));
    toast('Third party deleted');
  };

  const riskCls = (r: string) => {
    if (r === 'High' || r === 'Critical') return 'high';
    if (r === 'Medium') return 'medium';
    return 'ok';
  };

  const listCols = (showCompany ? 1 : 0) + 11 + (canEdit ? 1 : 0);

  return (
    <section className="tab-panel active">
      <div className="toolbar">
        {canEdit && (
          <button className="btn" onClick={addTP}>
            + Add Third Party / Vendor
          </button>
        )}
        <div className="spacer"></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {showCompany && <th>Company</th>}
              <th>Vendor ID</th>
              <th>Vendor Name</th>
              <th>Vendor Status</th>
              <th>Vendor Type</th>
              <th>Dept Category</th>
              <th>Business Owner</th>
              <th>Vendor Contact</th>
              <th>Contract Owner</th>
              <th>Processing Activity</th>
              <th>DPA</th>
              <th>Risk</th>
              {canEdit && <th></th>}
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={listCols}>
                  <div className="empty-state">
                    No third parties recorded yet.{' '}
                    {canEdit && (
                      <button className="btn sm" onClick={addTP}>
                        + Add Third Party / Vendor
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              list.map((tp) => (
                <tr key={tp.id}>
                  {showCompany && <td>{esc(clientNameOf((tp as { clientId?: string }).clientId || ''))}</td>}
                  <td>
                    <span className="hint" style={{ fontFamily: 'monospace', fontSize: 11.5 }}>
                      {esc(tp.code || '-')}
                    </span>
                  </td>
                  <td>
                    <b>{esc(tp.vendor)}</b>
                  </td>
                  <td>
                    <span className={`badge ${tp.vendorStatus === 'Active' ? 'ok' : 'high'}`}>{esc(tp.vendorStatus || 'Active')}</span>
                  </td>
                  <td>{esc(tp.type || '-')}</td>
                  <td>{esc(tp.departmentCategory || '-')}</td>
                  <td>{esc(tp.businessOwner || '-')}</td>
                  <td>{esc(tp.vendorContact || '-')}</td>
                  <td>{esc(tp.contractOwner || '-')}</td>
                  <td style={{ maxWidth: 220 }}>{esc(tp.processingActivity || '-')}</td>
                  <td>
                    {tp.dpaInPlace === 'Available' ? <span className="badge ok">Available</span> : <span className="badge high">Not Available</span>}
                  </td>
                  <td>
                    <span className={`badge ${riskCls(tp.risk)}`}>{esc(tp.risk || '-')}</span>
                  </td>
                  {canEdit && (
                    <td>
                      <button className="icon-btn" title="Edit" onClick={() => editTP(tp)}>
                        &#9998;
                      </button>
                      <button
                        className="icon-btn"
                        title="Delete"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => deleteTP(tp)}
                      >
                        &#128465;
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
