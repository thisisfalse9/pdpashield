// Heuristic PII detection for tabular data. Pattern-based: it WILL miss some
// values and flag some false positives. Never present as perfectly accurate.

export type PiiType = "name" | "email" | "phone" | "nric" | "other";
export type Severity = "High" | "Medium" | "Low";
export type MaskMode = "redact" | "partial" | "hash" | "keep";

export const PII_LABEL: Record<PiiType, string> = {
  name: "Person name",
  email: "Email address",
  phone: "Phone number",
  nric: "NRIC / FIN-like ID",
  other: "Other personal data",
};

export const PII_SEVERITY: Record<PiiType, Severity> = {
  nric: "High",
  phone: "Medium",
  email: "Medium",
  name: "Low",
  other: "Medium",
};

export const PII_ACTION: Record<PiiType, string> = {
  nric: "Remove or fully redact. PDPC advises against collecting full NRIC unless required by law.",
  phone: "Partially mask before analytics or AI use.",
  email: "Partially mask or pseudonymise.",
  name: "Pseudonymise or drop if not needed for the purpose.",
  other: "Review and mask before AI use.",
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NRIC = /^[STFGM]\d{7}[A-Z]$/i;
const PHONE = /^(\+?65[\s-]?)?[3689]\d{3}[\s-]?\d{4}$/;
const NAME_HEADER = /(^|_|\s)(name|full.?name|first.?name|last.?name|contact|client|customer)($|_|\s)/i;

export function classifyValue(v: string): PiiType | null {
  const s = v.trim();
  if (!s) return null;
  if (EMAIL.test(s)) return "email";
  if (NRIC.test(s)) return "nric";
  if (PHONE.test(s)) return "phone";
  return null;
}

export interface Finding {
  column: string;
  type: PiiType;
  label?: string;
  source?: "pattern" | "ai";
  count: number;
  severity: Severity;
  action: string;
}

export type Row = Record<string, string>;

export function detectPii(rows: Row[], columns: string[]): Finding[] {
  const findings: Finding[] = [];
  for (const col of columns) {
    const counts: Partial<Record<PiiType, number>> = {};
    for (const r of rows) {
      const t = classifyValue(String(r[col] ?? ""));
      if (t) counts[t] = (counts[t] ?? 0) + 1;
    }
    if (NAME_HEADER.test(col) && !/(company|file|user)/i.test(col)) {
      const n = rows.filter((r) => /^[A-Za-z][A-Za-z' .-]+$/.test(String(r[col] ?? "").trim())).length;
      if (n) counts.name = (counts.name ?? 0) + n;
    }
    for (const [t, c] of Object.entries(counts) as [PiiType, number][]) {
      findings.push({ column: col, type: t, count: c, severity: PII_SEVERITY[t], action: PII_ACTION[t] });
    }
  }
  return findings;
}

function simpleHash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return "h_" + (h >>> 0).toString(16).padStart(8, "0");
}

export function maskValue(v: string, type: PiiType, mode: MaskMode): string {
  if (!v || mode === "keep") return v;
  if (mode === "redact") return "[REDACTED]";
  if (mode === "hash") return simpleHash(v);
  // partial
  if (type === "email") {
    const [u, d] = v.split("@");
    return (u?.[0] ?? "") + "***@" + (d ?? "");
  }
  if (type === "nric") return "*****" + v.slice(-4);
  if (type === "other") return v.length <= 2 ? "**" : v[0] + "*".repeat(Math.min(8, v.length - 1));
  if (type === "phone") return v.replace(/\d(?=(?:\D*\d){4})/g, "*");
  return v
    .split(/\s+/)
    .map((w) => (w[0] ?? "") + "***")
    .join(" ");
}

export function maskRows(rows: Row[], findings: Finding[], modes: Record<string, MaskMode>): Row[] {
  const byCol = new Map<string, PiiType>();
  // pick highest-severity type per column
  const rank = { High: 3, Medium: 2, Low: 1 };
  for (const f of findings) {
    const cur = byCol.get(f.column);
    if (!cur || rank[f.severity] > rank[PII_SEVERITY[cur]]) byCol.set(f.column, f.type);
  }
  return rows.map((r) => {
    const out: Row = { ...r };
    for (const [col, type] of byCol) {
      const mode = modes[col] ?? "partial";
      out[col] = maskValue(String(r[col] ?? ""), type, mode);
    }
    return out;
  });
}

export interface Scores {
  privacyRisk: number; // 0-100, higher = more risk
  dataQuality: number; // 0-100, higher = better
  aiReadiness: number; // 0-100, higher = better
  missingCells: number;
}

export function scoreDataset(rows: Row[], columns: string[], findings: Finding[], masked: boolean): Scores {
  const cells = Math.max(1, rows.length * columns.length);
  let missing = 0;
  for (const r of rows) for (const c of columns) if (!String(r[c] ?? "").trim()) missing++;
  const dataQuality = Math.round(100 * (1 - missing / cells));
  const weight = { High: 3, Medium: 2, Low: 1 };
  const exposure = findings.reduce((a, f) => a + weight[f.severity] * f.count, 0);
  const raw = Math.min(100, Math.round((exposure / Math.max(1, rows.length)) * 25));
  const privacyRisk = masked ? Math.round(raw * 0.15) : raw;
  const aiReadiness = Math.max(0, Math.round(dataQuality * 0.5 + (100 - privacyRisk) * 0.5));
  return { privacyRisk, dataQuality, aiReadiness, missingCells: missing };
}

export const SAMPLE_CSV = `client_name,email,phone,nric,company,engagement,fee_sgd
Tan Wei Ming,weiming.tan@example.sg,+65 9123 4567,S1234567D,Lion City Traders Pte Ltd,Annual audit,8500
Priya Raman,priya.r@example.com,8234 5678,T0123456G,Marina Bay Florist,Tax filing,1200
Ahmad bin Ismail,ahmad.ismail@example.sg,9876 5432,S8765432A,Kampong Glam Cafe,Bookkeeping,2400
Chloe Lim,,6345 1122,F1234567N,Orchard Design Studio,GST registration,650
Rajesh Kumar,rajesh.k@example.net,+65 8111 2233,G7654321M,Jurong Logistics,Annual audit,12000
Lee Hui Min,huimin.lee@example.sg,,S2345678B,Tiong Bahru Bakery,Payroll,1800
Nur Aisyah,nur.aisyah@example.com,9001 2345,T1122334C,Bedok Tuition Centre,Tax filing,
Marcus Ong,marcus.ong@example.sg,8899 7766,S3456789Z,Clarke Quay Events,Bookkeeping,3200`;
