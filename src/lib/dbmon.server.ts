// Server-only reader for the customer's own database project.
// Reads with a read-only key over HTTPS. Never imported from route files —
// only from *.functions.ts handlers, so it stays out of the browser bundle.
import {
  isSafeTableName,
  maskHost,
  parseInventory,
  scanTable,
  SAMPLE_ROWS,
  TABLE_CAP,
  type TableMeta,
  type TableScan,
} from "./monitoring";
import type { Row } from "./pii";

const TIMEOUT_MS = 9000;
const SCAN_BUDGET_MS = 25000;
const VALUE_CAP = 200;

export interface Target {
  url: string;
  key: string;
  host: string;
}

export interface Status {
  configured: boolean;
  host: string;
  tables: TableMeta[] | null;
  error?: string;
}

/** The database being monitored, or null when nothing is configured. */
export function readTarget(): Target | null {
  const rawUrl = process.env["MONITOR_DB_URL"]?.trim();
  const key = process.env["MONITOR_DB_KEY"]?.trim();
  if (!rawUrl || !key) return null;
  const url = rawUrl.replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(url)) return null;
  return { url, key, host: maskHost(url) };
}

async function call(target: Target, path: string, init: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    apikey: target.key,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  for (const [k, v] of Object.entries(init.headers ?? {})) headers[k] = String(v);
  return fetch(target.url + path, {
    ...init,
    headers,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

/** Ask the customer's project which tables and columns exist (metadata only). */
export async function fetchInventory(target: Target): Promise<{ tables: TableMeta[] } | { error: string }> {
  let res: Response;
  try {
    res = await call(target, "/rest/v1/rpc/pdpa_monitor_inventory", { method: "POST", body: "{}" });
  } catch (e) {
    return { error: `Could not reach your database (${e instanceof Error ? e.name : "network error"}).` };
  }
  if (res.status === 404) {
    return { error: "The table-listing helper is missing from your project. Run the setup script once, then reload." };
  }
  if (res.status === 401 || res.status === 403) {
    return { error: "Your read-only key was rejected. Check that it belongs to this project and can read data." };
  }
  if (!res.ok) return { error: `Your project returned HTTP ${res.status}.` };
  const json = await res.json().catch(() => null);
  if (!Array.isArray((json as { tables?: unknown })?.tables)) {
    return { error: "The table-listing helper returned an unexpected response." };
  }
  return { tables: parseInventory(json) };
}

/** Exact row count without downloading the table. */
export async function countRows(target: Target, table: string): Promise<number> {
  if (!isSafeTableName(table)) return 0;
  const res = await call(target, `/rest/v1/${encodeURIComponent(table)}?select=*`, {
    headers: { Prefer: "count=exact", Range: "0-0", "Range-Unit": "items" },
  });
  if (!res.ok) return 0;
  const m = /\/(\d+)\s*$/.exec(res.headers.get("content-range") ?? "");
  return m ? Number(m[1]) : 0;
}

/** A small sample of real rows, truncated, for personal-data detection. */
export async function sampleRows(target: Target, table: string, limit = SAMPLE_ROWS): Promise<Row[]> {
  if (!isSafeTableName(table)) return [];
  const res = await call(target, `/rest/v1/${encodeURIComponent(table)}?select=*&limit=${limit}`);
  if (!res.ok) return [];
  const json = await res.json().catch(() => null);
  if (!Array.isArray(json)) return [];
  return json.slice(0, limit).map((raw) => {
    const out: Row = {};
    for (const [k, v] of Object.entries((raw ?? {}) as Record<string, unknown>)) {
      out[k] = v == null ? "" : String(v).slice(0, VALUE_CAP);
    }
    return out;
  });
}

/** Inventory + counts + masked samples for every readable table. */
export async function runScan(): Promise<
  { ok: true; host: string; at: string; tables: TableScan[] } | { ok: false; error: string; host: string }
> {
  const target = readTarget();
  if (!target) return { ok: false, error: "No database is configured for this workspace.", host: "" };
  const inv = await fetchInventory(target);
  if ("error" in inv) return { ok: false, error: inv.error, host: target.host };

  const scans: TableScan[] = [];
  const deadline = Date.now() + SCAN_BUDGET_MS;
  for (const meta of inv.tables.slice(0, TABLE_CAP)) {
    if (Date.now() > deadline) break;
    const [rowCount, rows] = await Promise.all([
      countRows(target, meta.table),
      sampleRows(target, meta.table),
    ]);
    scans.push(scanTable(meta, rowCount, rows));
  }
  return { ok: true, host: target.host, at: new Date().toISOString(), tables: scans };
}

/** Connection status, used to decide what the Database page can show. */
export async function probeTarget(): Promise<Status> {
  const target = readTarget();
  if (!target) return { configured: false, host: "", tables: null };
  const inv = await fetchInventory(target);
  if ("error" in inv) return { configured: true, host: target.host, tables: null, error: inv.error };
  return { configured: true, host: target.host, tables: inv.tables };
}
