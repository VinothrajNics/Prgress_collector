'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '@/store/AppContext';
import { api } from '@/lib/api';
import {
  RISK_ANSWER_OPTIONS,
  RISK_DOMAINS,
  RISK_QUESTIONS,
  RISK_RATINGS,
  answerValue,
  computeDomainScores,
  overallScore,
  ratingFor,
  type RiskQuestion,
} from '@/lib/riskQuestions';

const esc = (v: unknown) => (v === undefined || v === null ? '' : String(v));

export default function RiskComplianceTab() {
  const { isAdmin, scopeClientId, toast, clientNameOf, canEdit } = useApp();
  const clientId = isAdmin ? scopeClientId || undefined : undefined;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState<Date | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(() => {
    setLoaded(false);
    api
      .getRiskResponses(clientId)
      .then((r) => {
        const map: Record<string, string> = {};
        for (const x of r.list || []) map[x.questionId] = x.answer;
        setAnswers(map);
      })
      .catch((e) => toast(e.message || 'Failed to load responses', true))
      .finally(() => setLoaded(true));
  }, [clientId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const persist = (map: Record<string, string>) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      api
        .saveRiskResponses(map, clientId)
        .then(() => setSaved(new Date()))
        .catch((e) => toast(e.message || 'Save failed', true));
    }, 400);
  };

  const setAnswer = (qid: string, value: string) => {
    const next = { ...answers };
    if (value === '') delete next[qid];
    else next[qid] = value;
    setAnswers(next);
    persist(next);
  };

  const rows = useMemo(() => computeDomainScores(answers), [answers]);
  const overall = useMemo(() => overallScore(rows), [rows]);
  const overallRating = ratingFor(overall.percentage);
  const answeredCount = RISK_QUESTIONS.filter((q) => answers[q.id]).length;

  const groups = useMemo(() => {
    const m = new Map<string, RiskQuestion[]>();
    for (const q of RISK_QUESTIONS) {
      const arr = m.get(q.domain) || [];
      arr.push(q);
      m.set(q.domain, arr);
    }
    return RISK_DOMAINS.map((d) => ({ domain: d, items: m.get(d) || [] }));
  }, []);

  const selectOptions = (q: RiskQuestion): string[] => [...RISK_ANSWER_OPTIONS, ...(q.na ? ['N/A'] : [])];

  return (
    <section className="tab-panel active">
      <div className="banner">
        DPDP Compliance Risk Assessment &mdash; {clientNameOf(scopeClientId)}. Answer each question on a{' '}
        <b>3 = Strong &middot; 2 = Partial &middot; 1 = Weak &middot; 0 = None</b> scale. Questions marked N/A are
        excluded from scoring. {answeredCount} of {RISK_QUESTIONS.length} answered.
        {saved ? <span className="hint"> Last saved {saved.toLocaleTimeString()}</span> : null}
      </div>

      <div className="section-title">Domain Summary</div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Domain</th>
              <th>Assigned Score</th>
              <th>Total Score</th>
              <th>Percentage</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const rt = ratingFor(r.percentage);
              return (
                <tr key={r.domain}>
                  <td>
                    <b>{esc(r.domain)}</b>
                  </td>
                  <td>{r.assigned}</td>
                  <td>{r.total}</td>
                  <td>{r.percentage === null ? '-' : r.percentage + '%'}</td>
                  <td>{rt ? <RatingBadge ratingKey={rt.key} emoji={rt.emoji} label={rt.label} /> : <span className="field-hint">Not rated</span>}</td>
                </tr>
              );
            })}
            <tr style={{ background: 'var(--panel)' }}>
              <td>
                <b>Overall</b>
              </td>
              <td>
                <b>{overall.assigned}</b>
              </td>
              <td>
                <b>{overall.total}</b>
              </td>
              <td>
                <b>{overall.percentage === null ? '-' : overall.percentage + '%'}</b>
              </td>
              <td>{overallRating ? <RatingBadge ratingKey={overallRating.key} emoji={overallRating.emoji} label={overallRating.label} /> : <span className="field-hint">Not rated</span>}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* <div className="section-title">Rating Interpretation</div>
      <div className="grid grid-4">
        {RISK_RATINGS.map((r) => (
          <div key={r.key} className="card" style={{ borderTop: '3px solid ' + ratingColor(r.key) }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>
              {r.emoji} {r.label}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{ratingRange(r.min)}%</div>
            <div style={{ fontSize: 12, color: 'var(--text)', marginTop: 4 }}>{r.interpretation}</div>
          </div>
        ))}
      </div> */}

      <div className="section-title" style={{ marginTop: 24 }}>
        Questionnaire
      </div>

      {groups.map((g) => {
        const domainRow = rows.find((r) => r.domain === g.domain);
        const domainRating = ratingFor(domainRow ? domainRow.percentage : null);
        return (
          <div key={g.domain} className="card" style={{ marginBottom: 16 }}>
            <div className="section-title" style={{ margin: '0 0 10px' }}>
              {esc(g.domain)}
              <span className="hint" style={{ fontWeight: 400 }}>
                {domainRow && domainRating ? ` ${domainRow.assigned} / ${domainRow.total} · ${domainRow.percentage}% · ${domainRating.emoji} ${domainRating.label}` : ''}
              </span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 90 }}>ID</th>
                    <th>Assessment Question</th>
                    <th style={{ width: 60 }}>Weight</th>
                    <th style={{ width: 110 }}>Answer</th>
                    <th style={{ width: 100 }}>Assigned Score</th>
                    <th style={{ width: 90 }}>Total Score</th>
                  </tr>
                </thead>
                <tbody>
                  {g.items.map((q) => {
                    const ans = answers[q.id] || '';
                    const val = answerValue(ans);
                    const assigned = val === null ? '' : q.weight * val;
                    const total = q.weight * 3;
                    return (
                      <tr key={q.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: 11.5 }}>{q.id}</td>
                        <td>{esc(q.question)}</td>
                        <td>{q.weight}</td>
                        <td>
                          {canEdit ? (
                            <select style={{ padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12.5 }} value={ans} onChange={(e) => setAnswer(q.id, e.target.value)}>
                              <option value="">--</option>
                              {selectOptions(q).map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span>{ans || '-'}</span>
                          )}
                        </td>
                        <td>
                          <b>{ans === 'N/A' ? <span className="field-hint">N/A</span> : assigned === '' ? '-' : assigned}</b>
                        </td>
                        <td>{q.weight === 0 ? '-' : total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

    </section>
  );
}

function ratingRange(min: number): string {
  if (min === 80) return '80\u2013100';
  if (min === 60) return '60\u201379';
  if (min === 40) return '40\u201359';
  return '0\u201339';
}

function ratingColor(key: string): string {
  if (key === 'strong') return '#1E7E34';
  if (key === 'moderate') return '#E8721E';
  if (key === 'weak') return '#E0A800';
  return '#C0392B';
}

function RatingBadge({ ratingKey, emoji, label }: { ratingKey: string; emoji: string; label: string }) {
  const cls = ratingKey === 'strong' ? 'ok' : ratingKey === 'moderate' ? 'medium' : ratingKey === 'weak' ? 'medium' : 'high';
  return (
    <span className={`badge ${cls}`} style={{ fontSize: 11.5, padding: '3px 10px' }}>
      {emoji} {label}
    </span>
  );
}
