// Deterministic synthetic events. Always labelled Demo Data in the UI.
const USERS = ["harry.tan", "priya.r", "huimin.lee", "marcus.ong", "svc_reporting", "svc_backup"];
const TABLES = ["clients", "client_contacts", "payroll", "invoices", "engagements", "staff"];
const ACTIONS = ["SELECT", "UPDATE", "INSERT", "DELETE", "EXPORT"];

function rng(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

export interface DbEvent { id: string; at: string; user: string; table: string; action: string; risk: number; status: "Allowed" | "Flagged" | "Blocked"; detail: string }

export function dbEvents(n = 60): DbEvent[] {
  const r = rng(42);
  const base = new Date("2026-10-15T09:00:00+08:00").getTime();
  return Array.from({ length: n }, (_, i) => {
    const user = USERS[Math.floor(r() * USERS.length)];
    const table = TABLES[Math.floor(r() * TABLES.length)];
    const action = ACTIONS[Math.floor(r() * ACTIONS.length)];
    const offHours = r() < 0.15;
    let risk = Math.round(r() * 40) + (action === "DELETE" || action === "EXPORT" ? 35 : 0) + (table === "payroll" ? 15 : 0) + (offHours ? 20 : 0);
    risk = Math.min(99, risk);
    const status = risk > 80 ? "Blocked" : risk > 60 ? "Flagged" : "Allowed";
    const rows = Math.round(r() * 5000);
    return {
      id: "e" + i, at: new Date(base - i * 1000 * 60 * 47).toISOString(), user, table, action, risk, status,
      detail: `${action} on ${table} affecting ${rows} rows${offHours ? " outside office hours" : ""}`,
    };
  });
}

export interface AuditRec { id: string; at: string; user: string; action: string; table: string; decision: "Approved" | "Rejected" | "Auto-logged"; detail: string }
export function auditRecords(n = 80): AuditRec[] {
  const r = rng(7);
  const base = new Date("2026-10-14T18:00:00+08:00").getTime();
  const acts = ["Access granted", "Access revoked", "Data export", "Schema change", "Record deletion", "Consent updated", "Retention purge"];
  return Array.from({ length: n }, (_, i) => {
    const d = r();
    return {
      id: "a" + i, at: new Date(base - i * 1000 * 60 * 60 * 9).toISOString(), user: USERS[Math.floor(r() * 4)],
      action: acts[Math.floor(r() * acts.length)], table: TABLES[Math.floor(r() * TABLES.length)],
      decision: d < 0.6 ? "Auto-logged" : d < 0.9 ? "Approved" : "Rejected",
      detail: `Ticket #${1000 + i}`,
    };
  });
}

export interface ModelEvent { id: string; at: string; model: string; version: string; type: "Config change" | "Approval" | "Deployment" | "User action" | "Rollback"; user: string; detail: string }
export const MODELS = [
  { name: "Invoice Classifier", version: "1.2.0", owner: "Priya Raman", status: "Production" },
  { name: "Receipt OCR Extractor", version: "0.9.3", owner: "Lee Hui Min", status: "Staging" },
  { name: "Client Risk Scorer", version: "0.4.1", owner: "Harry Tan", status: "Under Review" },
  { name: "Email Triage Assistant", version: "2.0.0", owner: "Marcus Ong", status: "Retired" },
];
export function modelEvents(): ModelEvent[] {
  const r = rng(99);
  const types: ModelEvent["type"][] = ["Config change", "Approval", "Deployment", "User action", "Rollback"];
  const details: Record<ModelEvent["type"], string> = {
    "Config change": "Confidence threshold changed 0.70 → 0.80", Approval: "Risk assessment approved by DPO", Deployment: "Deployed to production",
    "User action": "Bulk re-classification run", Rollback: "Rolled back after accuracy drop",
  };
  return Array.from({ length: 30 }, (_, i) => {
    const m = MODELS[Math.floor(r() * MODELS.length)];
    const t = types[Math.floor(r() * types.length)];
    return { id: "me" + i, at: new Date(Date.parse("2026-10-14T00:00:00Z") - i * 86400000 * 1.7).toISOString(), model: m.name, version: m.version, type: t, user: USERS[Math.floor(r() * 4)], detail: details[t] };
  });
}

export function modelMetrics(days = 30) {
  const r = rng(3);
  return Array.from({ length: days }, (_, i) => ({
    d: new Date(Date.parse("2026-10-15") - (days - 1 - i) * 86400000).toISOString().slice(5, 10),
    requests: Math.round(800 + r() * 600 + i * 10),
    latency: Math.round(180 + r() * 120 + (i > days - 6 ? 90 : 0)),
    errors: +(0.4 + r() * 1.2 + (i > days - 6 ? 1.5 : 0)).toFixed(2),
    drift: +(0.05 + i * 0.006 + r() * 0.03).toFixed(3),
  }));
}
