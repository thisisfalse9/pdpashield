// Pure, testable logic for live database monitoring. No network, no React,
// no server secrets — so it can run in the browser, on the server, and in tests.
import {
  detectPii,
  maskRows,
  scoreDataset,
  PII_LABEL,
  type Finding,
  type MaskMode,
  type PiiType,
  type Row,
  type Severity,
} from "./pii";

export interface TableColumn {
  name: string;
  type: string;
}

export interface TableMeta {
  table: string;
  columns: TableColumn[];
}

export interface TableScan {
  table: string;
  rowCount: number;
  sampled: number;
  columns: TableColumn[];
  findings: Finding[];
  sensitivity: Severity;
  privacyRisk: number;
  dataQuality: number;
  aiReadiness: number;
  missingCells: number;
  /** Sample rows with personal data already masked. Raw values never leave the server. */
  maskedSamples: Row[];
}

export interface MonitorAlert {
  id: string;
  table: string;
  severity: Severity;
  title: string;
  detail: string;
  risk: number;
}

export const SAMPLE_ROWS = 20;
export const TABLE_CAP = 25;
const MAX_TABLES = 40;
const IDENT = /^[a-z_][a-z0-9_]*$/i;

export function isSafeTableName(name: string): boolean {
  return IDENT.test(name) && name.length <= 63;
}

/** Turn the project's table-listing helper response into a checked inventory. */
export function parseInventory(raw: unknown): TableMeta[] {
  const tables = (raw as { tables?: unknown })?.tables;
  if (!Array.isArray(tables)) return [];
  const out: TableMeta[] = [];
  for (const entry of tables) {
    const name = (entry as { table?: unknown })?.table;
    if (typeof name !== "string" || !isSafeTableName(name)) continue;
    const rawCols = (entry as { columns?: unknown })?.columns;
    const columns: TableColumn[] = [];
    if (Array.isArray(rawCols)) {
      for (const c of rawCols) {
        const cname = (c as { name?: unknown })?.name;
        if (typeof cname !== "string" || !cname || cname.length > 63) continue;
        const ctype = (c as { type?: unknown })?.type;
        columns.push({ name: cname, type: typeof ctype === "string" ? ctype : "unknown" });
      }
    }
    out.push({ table: name, columns });
    if (out.length >= MAX_TABLES) break;
  }
  return out;
}

interface SchemaRule {
  re: RegExp;
  label: string;
  pii: PiiType;
  severity: Severity;
  action: string;
  risk: number;
}

/**
 * Columns whose values do not look like personal data (a salary is just a
 * number) but whose names say they are. Value patterns alone would miss these.
 */
export const SCHEMA_RULES: SchemaRule[] = [
  {
    re: /(\bnric\b|\bfin\b|identity[_\s]?card)/i,
    label: "NRIC / FIN",
    pii: "nric",
    severity: "High",
    action: "Remove or fully redact unless a specific law requires the full number.",
    risk: 85,
  },
  {
    re: /(bank[_\s]?(account|acc|no)|acct[_\s]?no|swift|sort[_\s]?code)/i,
    label: "Bank account",
    pii: "other",
    severity: "High",
    action: "Limit to payroll need-to-know and never include in bulk exports.",
    risk: 80,
  },
  {
    re: /(salary|basic[_\s]?pay|wage|bonus|commission)/i,
    label: "Salary",
    pii: "other",
    severity: "Medium",
    action: "Restrict to payroll staff and mask before analytics or AI use.",
    risk: 55,
  },
  {
    re: /(date[_\s]?of[_\s]?birth|\bdob\b)/i,
    label: "Date of birth",
    pii: "other",
    severity: "Medium",
    action: "Keep only the year of birth when the exact date is not needed.",
    risk: 50,
  },
  {
    re: /(home[_\s]?address|address[_\s]?\d?|\bpostal\b|postal[_\s]?code)/i,
    label: "Home address",
    pii: "other",
    severity: "Medium",
    action: "Use a billing area instead of a full address where possible.",
    risk: 45,
  },
];

/** Flag sensitive columns by name, counting the sampled rows that hold a value. */
export function schemaFindings(columns: TableColumn[], rows: Row[]): Finding[] {
  const out: Finding[] = [];
  for (const col of columns) {
    for (const rule of SCHEMA_RULES) {
      if (!rule.re.test(col.name)) continue;
      const count = rows.filter((r) => String(r[col.name] ?? "").trim() !== "").length;
      if (count > 0) {
        out.push({
          column: col.name,
          type: rule.pii,
          label: rule.label,
          source: "pattern",
          count,
          severity: rule.severity,
          action: rule.action,
        });
      }
      break; // one rule per column, first match wins
    }
  }
  return out;
}

const SEV_RANK: Record<Severity, number> = { High: 3, Medium: 2, Low: 1 };

/** Merge finding lists that looked at the same rows, keeping the clearer label. */
export function combineFindings(a: Finding[], b: Finding[]): Finding[] {
  const map = new Map<string, Finding>();
  for (const f of [...a, ...b]) {
    const key = `${f.column}|${f.type}`;
    const cur = map.get(key);
    if (!cur) map.set(key, { ...f });
    else map.set(key, { ...cur, label: cur.label ?? f.label, count: Math.max(cur.count, f.count) });
  }
  return [...map.values()].sort(
    (x, y) => SEV_RANK[y.severity] - SEV_RANK[x.severity] || y.count - x.count,
  );
}

export function sensitivityOf(findings: Finding[]): Severity {
  if (findings.some((f) => f.severity === "High")) return "High";
  if (findings.some((f) => f.severity === "Medium")) return "Medium";
  return "Low";
}

/** High-risk columns are fully redacted; the rest are partially masked. */
export function maskModesFor(findings: Finding[]): Record<string, MaskMode> {
  const modes: Record<string, MaskMode> = {};
  for (const f of findings) modes[f.column] = f.severity === "High" ? "redact" : "partial";
  return modes;
}

export function riskOf(f: Finding): number {
  for (const rule of SCHEMA_RULES) {
    if (rule.label === f.label && rule.re.test(f.column)) return rule.risk;
  }
  const byType: Record<PiiType, number> = { nric: 85, email: 55, phone: 50, name: 30, other: 60 };
  return byType[f.type] ?? 60;
}

/** Score one table from its sampled rows and report masked samples only. */
export function scanTable(meta: TableMeta, rowCount: number, rows: Row[]): TableScan {
  const columns = meta.columns.map((c) => c.name);
  const findings = combineFindings(detectPii(rows, columns), schemaFindings(meta.columns, rows));
  const scores = scoreDataset(rows, columns, findings, false);
  return {
    table: meta.table,
    rowCount,
    sampled: rows.length,
    columns: meta.columns,
    findings,
    sensitivity: sensitivityOf(findings),
    maskedSamples: maskRows(rows, findings, maskModesFor(findings)),
    ...scores,
  };
}

/** One alert per medium-or-worse column, plus a whole-table alert when exposure is high. */
export function alertsFromScan(scans: TableScan[]): MonitorAlert[] {
  const alerts: MonitorAlert[] = [];
  for (const s of scans) {
    for (const f of s.findings) {
      if (f.severity === "Low") continue;
      const label = f.label ?? PII_LABEL[f.type];
      alerts.push({
        id: `${s.table}:${f.column}:${f.label ?? f.type}`,
        table: s.table,
        severity: f.severity,
        title: `${label} in ${s.table}`,
        detail: `${f.count} of ${s.sampled || 1} sampled rows in ${s.table}.${f.column}. ${f.action}`,
        risk: riskOf(f),
      });
    }
    if (s.privacyRisk >= 60 && !alerts.some((a) => a.table === s.table)) {
      alerts.push({
        id: `${s.table}:_overall`,
        table: s.table,
        severity: "High",
        title: `High exposure in ${s.table}`,
        detail: `Privacy risk ${s.privacyRisk}/100 across ${s.rowCount.toLocaleString()} rows. Review who can read this table and what is exported from it.`,
        risk: Math.min(95, 60 + Math.round(s.privacyRisk / 4)),
      });
    }
  }
  return alerts.sort((a, b) => b.risk - a.risk);
}

export function scanTotals(scans: TableScan[]) {
  return {
    tables: scans.length,
    rows: scans.reduce((a, s) => a + s.rowCount, 0),
    findings: scans.reduce((a, s) => a + s.findings.length, 0),
    high: scans.reduce((a, s) => a + s.findings.filter((f) => f.severity === "High").length, 0),
  };
}

export function scanSummary(scans: TableScan[]): string {
  const t = scanTotals(scans);
  return `${t.tables} tables, ${t.rows.toLocaleString()} rows, ${t.findings} personal-data columns (${t.high} high risk)`;
}

/** Show a target host without repeating the whole project reference. */
export function maskHost(url: string): string {
  try {
    const u = new URL(url);
    const parts = u.hostname.split(".");
    const head = parts[0] ?? "";
    if (!head) return u.origin;
    const shown = head.length <= 6 ? `${head.slice(0, 1)}…` : `${head.slice(0, 3)}…${head.slice(-3)}`;
    return `${u.protocol}//${[shown, ...parts.slice(1)].join(".")}`;
  } catch {
    return "unknown host";
  }
}
