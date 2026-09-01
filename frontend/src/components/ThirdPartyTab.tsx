'use client';

import { useApp } from '@/store/AppContext';
import { useUi } from './App';
import { esc, uid } from '@/lib/utils';
import type { ThirdParty } from '@/lib/types';

export default function ThirdPartyTab() {
  const { state, mutate, toast } = useApp();
  const ui = useUi();
  const list = state.thirdParties.list;

  const addTP = () =>
    ui.openModal('thirdparty', null, 'Add Third Party', (rec) => {
      rec.id = uid('tp');
      mutate('thirdParties', (t) => ({ ...t, list: [...t.list, rec as unknown as ThirdParty] }));
      toast('Third party added');
    });

  const editTP = (tp: ThirdParty) =>
    ui.openModal('thirdparty', tp, 'Edit Third Party', (rec) => {
      Object.assign(tp, rec);
      mutate('thirdParties', (t) => ({ ...t, list: t.list.map((x) => (x.id === tp.id ? tp : x)) }));
      toast('Third party updated');
    });

  const deleteTP = (tp: ThirdParty) => {
    if (!window.confirm('Delete this third party?')) return;
    mutate('thirdParties', (t) => ({ ...t, list: t.list.filter((x) => x.id !== tp.id) }));
    toast('Third party deleted');
  };

  return (
    <section className="tab-panel active">
      <div className="toolbar">
        <button className="btn" onClick={addTP}>
          + Add Third Party
        </button>
        <div className="spacer"></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Type</th>
              <th>Service</th>
              <th>Country</th>
              <th>DPA</th>
              <th>Security Assessment</th>
              <th>Risk</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    No third parties recorded yet.{' '}
                    <button className="btn sm" onClick={addTP}>
                      + Add Third Party
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              list.map((tp) => (
                <tr key={tp.id}>
                  <td>
                    <b>{esc(tp.vendor)}</b>
                  </td>
                  <td>{esc(tp.type || '-')}</td>
                  <td>{esc(tp.service || '-')}</td>
                  <td>{esc(tp.country || '-')}</td>
                  <td>{tp.dpaInPlace === 'Yes' ? <span className="badge ok">Yes</span> : <span className="badge high">No</span>}</td>
                  <td>
                    {tp.securityAssessment === 'Yes' ? (
                      <span className="badge ok">Yes</span>
                    ) : (
                      <span className="badge medium">No</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${tp.risk === 'High' ? 'high' : tp.risk === 'Low' ? 'ok' : 'medium'}`}>
                      {esc(tp.risk || '-')}
                    </span>
                  </td>
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
