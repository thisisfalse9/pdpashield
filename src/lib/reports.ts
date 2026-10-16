export interface MonthlyReport {
  month: string; // YYYY-MM
  manual: number;
  monitoring: number;
  auditing: number;
  overall: number;
  weights: { manual: number; monitoring: number; auditing: number };
  answered: number;
  totalControls: number;
  openTasks: number;
  note: string;
  savedBy: string;
  savedAt: string;
}

export const monthKey = (d: Date = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export function monthLabel(m: string) {
  const [y, mo] = m.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString("en-SG", { month: "long", year: "numeric" });
}

/** One report per month: saving again in the same month replaces it. Sorted newest first. */
export function upsertReport(list: MonthlyReport[], r: MonthlyReport): MonthlyReport[] {
  return [r, ...list.filter((x) => x.month !== r.month)].sort((a, b) => b.month.localeCompare(a.month));
}

/** Change in overall score vs the previous saved month, or null if none. */
export function changeFromPrevious(list: MonthlyReport[], month: string): number | null {
  const sorted = [...list].sort((a, b) => b.month.localeCompare(a.month));
  const i = sorted.findIndex((x) => x.month === month);
  if (i < 0 || i + 1 >= sorted.length) return null;
  return sorted[i].overall - sorted[i + 1].overall;
}

export function reportText(r: MonthlyReport, org: string) {
  return [
    `PDPA Score Report — ${monthLabel(r.month)}`,
    `Organisation: ${org}`,
    `Saved by ${r.savedBy} on ${r.savedAt}`,
    "",
    `Overall PDPA score: ${r.overall}`,
    `  Manual assessment: ${r.manual} (weight ${r.weights.manual})`,
    `  Database monitoring: ${r.monitoring} (weight ${r.weights.monitoring}) — Demo Data`,
    `  Data auditing: ${r.auditing} (weight ${r.weights.auditing}) — Demo Data`,
    "",
    `Controls answered: ${r.answered}/${r.totalControls}`,
    `Open remediation tasks: ${r.openTasks}`,
    r.note ? `Notes: ${r.note}` : "",
    "",
    "Internal readiness estimate only. Not an official PDPC assessment, audit or certification.",
  ].join("\n");
}
