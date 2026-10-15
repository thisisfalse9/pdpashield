import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PII_LABEL } from "./pii";
import { scanSummary, scanTotals } from "./monitoring";

// Every function here is signed-in only: an unauthenticated server function is a
// public endpoint, and these read a real customer database.

/** Connection status plus the live table inventory. */
export const monitorStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { probeTarget } = await import("./dbmon.server");
    return probeTarget();
  });

/** Scan the monitored database and record what was looked at, in the audit trail. */
export const monitorScan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { runScan } = await import("./dbmon.server");
    const result = await runScan();
    if (!result.ok) return result;

    const email = typeof context.claims.email === "string" ? context.claims.email : "";
    const base = { user_id: context.userId, actor_email: email, target_host: result.host };

    const highRisk = result.tables
      .flatMap((t) =>
        t.findings
          .filter((f) => f.severity === "High")
          .slice(0, 4)
          .map((f) => ({
            ...base,
            action: "PII_DETECTED",
            table_name: t.table,
            detail: `${f.label ?? PII_LABEL[f.type]} in ${f.column} (${f.count} of ${t.sampled} sampled rows)`,
            findings: [
              {
                column: f.column,
                type: f.type,
                label: f.label ?? null,
                count: f.count,
                severity: f.severity,
              },
            ],
          })),
      )
      .slice(0, 10);

    await context.supabase.from("db_audit_events").insert([
      {
        ...base,
        action: "DB_SCAN",
        table_name: null,
        detail: scanSummary(result.tables),
        findings: [],
      },
      ...highRisk,
    ]);

    return { ...result, totals: scanTotals(result.tables) };
  });

/** Audit records for the signed-in user, newest first. */
export const monitorAuditEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("db_audit_events")
      .select("id, action, table_name, detail, target_host, at, findings")
      .order("at", { ascending: false })
      .limit(100);
    return { events: data ?? [] };
  });
