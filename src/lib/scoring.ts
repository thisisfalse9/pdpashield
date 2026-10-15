// Internal PDPA readiness estimate. NOT an official PDPC assessment or certification.
export type Answer = "Yes" | "Partial" | "No" | "N/A" | "";

export interface Control {
  id: string;
  obligation: string;
  question: string;
  weight: number;
}

export const ANSWER_VALUE: Record<Exclude<Answer, "N/A" | "">, number> = { Yes: 1, Partial: 0.5, No: 0 };

/** Weighted score over applicable, answered controls. N/A and unanswered are excluded. */
export function calcScore(controls: Control[], answers: Record<string, Answer>): number {
  let total = 0;
  let got = 0;
  for (const c of controls) {
    const a = answers[c.id];
    if (!a || a === "N/A") continue;
    total += c.weight;
    got += c.weight * ANSWER_VALUE[a];
  }
  return total === 0 ? 0 : Math.round((got / total) * 100);
}

export function riskScore(likelihood: number, impact: number) {
  const s = likelihood * impact; // 1..25
  const level = s >= 15 ? "High" : s >= 8 ? "Medium" : "Low";
  return { score: s, level } as const;
}

export interface ScoreWeights { manual: number; monitoring: number; auditing: number }
export const DEFAULT_WEIGHTS: ScoreWeights = { manual: 50, monitoring: 25, auditing: 25 };

/** Share of database events that passed without being flagged or blocked. */
export function monitoringScore(events: { status: "Allowed" | "Flagged" | "Blocked" }[]): number {
  if (!events.length) return 0;
  return Math.round((events.filter((e) => e.status === "Allowed").length / events.length) * 100);
}

/** Share of audit records that were approved or auto-logged (not rejected). */
export function auditingScore(records: { decision: "Approved" | "Rejected" | "Auto-logged" }[]): number {
  if (!records.length) return 0;
  return Math.round((records.filter((r) => r.decision !== "Rejected").length / records.length) * 100);
}

/** Weighted average of the three sub-scores; weights are relative (need not sum to 100). */
export function combinedScore(s: ScoreWeights, w: ScoreWeights): number {
  const t = w.manual + w.monitoring + w.auditing;
  if (t <= 0) return 0;
  return Math.round((s.manual * w.manual + s.monitoring * w.monitoring + s.auditing * w.auditing) / t);
}
