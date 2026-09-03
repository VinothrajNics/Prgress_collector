export interface RiskQuestion {
  id: string;
  domain: string;
  question: string;
  weight: number;
  na?: boolean;
}

export const RISK_ANSWER_OPTIONS = ['3', '2', '1', '0'];

export const RISK_QUESTIONS: RiskQuestion[] = [
  { id: 'DPDP-001', domain: 'Applicability', question: 'Has the organisation assessed whether the DPDP Act applies to its processing of digital personal data?', weight: 2, na: true },
  { id: 'DPDP-002', domain: 'Applicability', question: 'Has the organisation identified the categories of Data Principals whose personal data it processes?', weight: 2 },
  { id: 'DPDP-003', domain: 'Governance', question: 'Has senior management formally assigned responsibility for DPDP compliance?', weight: 3 },
  { id: 'DPDP-004', domain: 'Governance', question: 'Has the organisation established a formal DPDP compliance governance framework?', weight: 3 },
  { id: 'DPDP-005', domain: 'Governance', question: 'Are DPDP responsibilities allocated across relevant departments?', weight: 2 },
  { id: 'DPDP-006', domain: 'Governance', question: 'Has management approved a DPDP compliance roadmap with timelines and owners?', weight: 3 },
  { id: 'DPDP-007', domain: 'Governance', question: 'Has a budget/resources been allocated for DPDP compliance?', weight: 2 },
  { id: 'DPDP-008', domain: 'Data Inventory', question: 'Has the organisation created an inventory of personal data processed?', weight: 0 },
  { id: 'DPDP-009', domain: 'Data Inventory', question: 'Has the organisation documented the source of personal data?', weight: 2 },
  { id: 'DPDP-010', domain: 'Data Inventory', question: 'Has the organisation identified where personal data is stored?', weight: 3 },
  { id: 'DPDP-011', domain: 'Data Inventory', question: 'Has the organisation identified who has access to personal data?', weight: 3 },
  { id: 'DPDP-012', domain: 'Data Flow', question: 'Has the organisation mapped how personal data moves between systems and departments?', weight: 3 },
  { id: 'DPDP-013', domain: 'Data Flow', question: 'Has the organisation identified external parties with whom personal data is shared?', weight: 3 },
  { id: 'DPDP-014', domain: 'Purpose', question: 'Has the organisation documented the purpose for which personal data is collected and processed?', weight: 3 },
  { id: 'DPDP-015', domain: 'Purpose', question: 'Does the organisation review whether personal data collected is necessary for the stated purpose?', weight: 2 },
  { id: 'DPDP-016', domain: 'Notice', question: 'Does the organisation provide an appropriate notice when personal data is collected?', weight: 3 },
  { id: 'DPDP-017', domain: 'Notice', question: 'Are privacy notices understandable and accessible to Data Principals?', weight: 2 },
  { id: 'DPDP-018', domain: 'Notice', question: 'Does the organisation maintain different notices where different processing contexts require them?', weight: 2 },
  { id: 'DPDP-019', domain: 'Consent', question: 'Has the organisation identified processing activities where consent is relied upon?', weight: 3 },
  { id: 'DPDP-020', domain: 'Consent', question: 'Where consent is required, does the organisation obtain consent through a valid mechanism?', weight: 3, na: true },
  { id: 'DPDP-021', domain: 'Consent', question: 'Does the organisation maintain evidence/records of consent?', weight: 3, na: true },
  { id: 'DPDP-022', domain: 'Consent', question: 'Can Data Principals withdraw consent through an accessible mechanism?', weight: 3, na: true },
  { id: 'DPDP-023', domain: 'Consent', question: 'Does withdrawal of consent trigger appropriate downstream actions?', weight: 3, na: true },
  { id: 'DPDP-024', domain: 'Rights', question: 'Has the organisation established a process for handling Data Principal rights requests?', weight: 3 },
  { id: 'DPDP-025', domain: 'Rights', question: 'Can the organisation verify the identity of a person making a Data Principal request?', weight: 2 },
  { id: 'DPDP-026', domain: 'Rights', question: 'Has the organisation established defined timelines and ownership for responding to requests?', weight: 3 },
  { id: 'DPDP-027', domain: 'Rights', question: 'Can the organisation coordinate Data Principal requests across relevant systems/departments?', weight: 3 },
  { id: 'DPDP-028', domain: 'Grievance', question: 'Has the organisation established a mechanism for Data Principal grievances?', weight: 3 },
  { id: 'DPDP-029', domain: 'Grievance', question: 'Are grievances tracked, investigated and closed with appropriate evidence?', weight: 2 },
  { id: 'DPDP-030', domain: 'Accuracy', question: 'Does the organisation have controls to maintain accurate personal data where required?', weight: 2 },
  { id: 'DPDP-031', domain: 'Retention', question: 'Has the organisation defined retention periods for categories of personal data?', weight: 3 },
  { id: 'DPDP-032', domain: 'Retention', question: 'Are retention periods linked to business, legal or regulatory requirements?', weight: 2 },
  { id: 'DPDP-033', domain: 'Deletion', question: 'Does the organisation have a process to delete personal data when it is no longer required?', weight: 3 },
  { id: 'DPDP-034', domain: 'Deletion', question: 'Can the organisation identify and delete personal data across relevant systems?', weight: 3 },
  { id: 'DPDP-035', domain: 'Security', question: 'Has the organisation implemented appropriate technical and organisational safeguards for personal data?', weight: 3 },
  { id: 'DPDP-036', domain: 'Security', question: 'Are access controls implemented to restrict personal data based on business need?', weight: 3 },
  { id: 'DPDP-037', domain: 'Security', question: 'Are privileged/user access rights periodically reviewed?', weight: 2 },
  { id: 'DPDP-038', domain: 'Security', question: 'Is personal data protected through appropriate security measures such as encryption, authentication, logging or monitoring?', weight: 3 },
  { id: 'DPDP-039', domain: 'Breach', question: 'Does the organisation have a documented personal data breach response procedure?', weight: 3 },
  { id: 'DPDP-040', domain: 'Breach', question: 'Does the incident response process include assessment, escalation, documentation and required notifications?', weight: 3 },
  { id: 'DPDP-041', domain: 'Third Party', question: 'Has the organisation identified all relevant Data Processors handling personal data?', weight: 3 },
  { id: 'DPDP-042', domain: 'Third Party', question: 'Does the organisation conduct privacy/security due diligence before onboarding relevant processors?', weight: 3 },
  { id: 'DPDP-043', domain: 'Third Party', question: 'Do processor contracts include appropriate data protection obligations?', weight: 3 },
  { id: 'DPDP-044', domain: 'Third Party', question: 'Does the organisation periodically monitor processor compliance?', weight: 2 },
  { id: 'DPDP-045', domain: 'Cross-Border', question: 'Has the organisation identified whether personal data is transferred/shared outside India?', weight: 2, na: true },
  { id: 'DPDP-046', domain: 'Policies', question: 'Does the organisation have a documented personal data/privacy policy framework?', weight: 3 },
  { id: 'DPDP-047', domain: 'Training', question: 'Do employees receive periodic DPDP/privacy awareness training?', weight: 2 },
  { id: 'DPDP-048', domain: 'Privacy by Design', question: 'Is privacy considered when launching new products, systems, applications or business processes?', weight: 3 },
  { id: 'DPDP-049', domain: 'Monitoring', question: 'Does the organisation periodically assess and report its DPDP compliance status to management?', weight: 3 },
  { id: 'DPDP-050', domain: 'Evidence', question: 'Can the organisation produce documented evidence demonstrating its DPDP compliance controls?', weight: 3 },
];

export const RISK_DOMAINS: string[] = (() => {
  const seen: string[] = [];
  for (const q of RISK_QUESTIONS) if (!seen.includes(q.domain)) seen.push(q.domain);
  return seen;
})();

export interface DomainScore {
  domain: string;
  questions: number;
  answered: number;
  assigned: number;
  total: number;
  percentage: number | null;
}

export interface RiskRating {
  key: string;
  emoji: string;
  label: string;
  interpretation: string;
  min: number;
}

export const RISK_RATINGS: RiskRating[] = [
  { key: 'strong', emoji: '\u{1F7E2}', label: 'Strong', interpretation: 'Good level of DPDP preparedness', min: 80 },
  { key: 'moderate', emoji: '\u{1F7E1}', label: 'Moderate', interpretation: 'Improvements required', min: 60 },
  { key: 'weak', emoji: '\u{1F7E0}', label: 'Weak', interpretation: 'Significant gaps', min: 40 },
  { key: 'critical', emoji: '\u{1F534}', label: 'Critical', interpretation: 'Immediate remediation required', min: 0 },
];

export function ratingFor(pct: number | null): RiskRating | null {
  if (pct === null) return null;
  for (const r of RISK_RATINGS) if (pct >= r.min) return r;
  return RISK_RATINGS[RISK_RATINGS.length - 1];
}

export function answerValue(answer: string | undefined): number | null {
  if (answer === 'N/A' || answer === undefined || answer === '') return null;
  const n = Number(answer);
  return Number.isFinite(n) ? n : null;
}

export function computeDomainScores(answers: Record<string, string>): DomainScore[] {
  const map = new Map<string, DomainScore>();
  for (const q of RISK_QUESTIONS) {
    const d = map.get(q.domain) || { domain: q.domain, questions: 0, answered: 0, assigned: 0, total: 0, percentage: null };
    d.questions += 1;
    const val = answerValue(answers[q.id]);
    if (val === null) {
      // N/A (or unanswered) — for totals, unanswered questions still count; N/A questions are excluded.
      const isNa = answers[q.id] === 'N/A';
      if (!isNa) d.total += 3 * q.weight;
    } else {
      d.answered += 1;
      d.assigned += q.weight * val;
      d.total += 3 * q.weight;
    }
    map.set(q.domain, d);
  }
  const rows = RISK_DOMAINS.map((domain) => map.get(domain)).filter((d): d is DomainScore => !!d);
  for (const r of rows) r.percentage = r.total > 0 ? Math.round((r.assigned / r.total) * 100) : null;
  return rows;
}

export function overallScore(rows: DomainScore[]): { assigned: number; total: number; percentage: number | null } {
  const assigned = rows.reduce((s, r) => s + r.assigned, 0);
  const total = rows.reduce((s, r) => s + r.total, 0);
  return { assigned, total, percentage: total > 0 ? Math.round((assigned / total) * 100) : null };
}
