import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Download, Loader2, PlugZap, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Page, DemoBadge, Notice, Status, Stat, Empty } from "@/components/app/kit";
import { monitorScan, monitorStatus } from "@/lib/dbmon.functions";
import { scanTotals, type TableScan } from "@/lib/monitoring";
import { useSession } from "@/lib/auth";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/sources/database")({
  head: () => meta("Database Source", "Connected database, live table inventory and personal-data findings."),
  component: DbSource,
});

const DEMO_TABLES = [
  ["clients", 1240, "name, email, nric_last4, phone", "High"],
  ["client_contacts", 3102, "name, email, phone", "Medium"],
  ["payroll", 288, "nric, salary, bank_account", "High"],
  ["invoices", 9870, "client_id, amount", "Low"],
  ["engagements", 2210, "client_id, partner", "Low"],
] as const;

type StatusDto = Awaited<ReturnType<typeof monitorStatus>>;
type ScanDto = Awaited<ReturnType<typeof monitorScan>>;
type ScanOk = Extract<ScanDto, { ok: true }>;

function DbSource() {
  const { session, ready } = useSession();
  const [inv, setInv] = useState<StatusDto | null>(null);
  const [scan, setScan] = useState<ScanOk | null>(null);
  const [busy, setBusy] = useState<"" | "status" | "scan">("");

  const load = useCallback(async () => {
    setBusy("status");
    try {
      setInv(await monitorStatus());
    } catch {
      setInv({ configured: true, host: "", tables: null, error: "The server could not be reached." });
    } finally {
      setBusy("");
    }
  }, []);

  useEffect(() => {
    if (session) void load();
    else {
      setInv(null);
      setScan(null);
    }
  }, [session, load]);

  const runScan = async () => {
    setBusy("scan");
    try {
      const res = await monitorScan();
      if (res.ok) {
        setScan(res);
        toast.success("Scan complete — findings saved and audit records added");
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("The scan could not be completed.");
    } finally {
      setBusy("");
    }
  };

  const tables: TableScan[] | null = scan?.tables ?? null;
  const inventory = inv?.tables ?? null;
  const totals = tables ? scanTotals(tables) : null;
  const needsSetup = !inv?.error && inventory !== null && inventory.length === 0;
  const helperMissing = !!inv?.error && inv.error.includes("helper");
  const badge = !inv
    ? busy === "status"
      ? "Processing"
      : "Not Connected"
    : inv.error
      ? "Failed"
      : inv.configured
        ? "Connected"
        : "Not Connected";

  const rows = tables
    ? tables.map((t) => ({
        table: t.table,
        cols: t.columns.length,
        personal: t.findings.map((f) => f.label ?? f.type).join(", ") || "None found",
        rowCount: t.rowCount.toLocaleString(),
        sensitivity: t.sensitivity,
      }))
    : (inventory ?? []).map((t) => ({
        table: t.table,
        cols: t.columns.length,
        personal: "Run a scan",
        rowCount: "—",
        sensitivity: "Pending",
      }));

  return (
    <Page
      title="Database"
      description="Live inventory from the database this workspace monitors. The sample tables below stay available for demos."
      actions={
        <>
          <Button asChild variant="outline" size="sm">
            <a href="/monitor-setup.sql" download>
              <Download className="mr-2 h-4 w-4" />
              Download setup script
            </a>
          </Button>
          <Button variant="outline" size="sm" disabled={!session || busy !== ""} onClick={() => void load()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload
          </Button>
          <Button size="sm" disabled={!session || busy !== ""} onClick={() => void runScan()}>
            {busy === "scan" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlugZap className="mr-2 h-4 w-4" />}
            Run scan
          </Button>
        </>
      }
    >
      {!ready || !session ? null : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Tables found" value={totals ? totals.tables : (inventory?.length ?? "—")} />
            <Stat label="Rows" value={totals ? totals.rows.toLocaleString() : "—"} />
            <Stat
              label="High-risk columns"
              value={totals ? totals.high : "—"}
              tone={totals && totals.high > 0 ? "danger" : "brand"}
            />
          </div>

          <Card className="shadow-card">
            <CardHeader className="flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">Live inventory · {inv?.host || "no target configured"}</CardTitle>
              <Status value={badge} />
            </CardHeader>
            <CardContent className="space-y-3">
              {inv?.error && <Notice tone="warning">{inv.error}</Notice>}
              {needsSetup && (
                <Notice tone="warning">
                  Your database project has no tables yet, so there is nothing to monitor. Run the setup
                  script once in your own project and reload this page.
                </Notice>
              )}
              {(needsSetup || helperMissing) && (
                <Button asChild variant="outline" size="sm">
                  <a href="/monitor-setup.sql" download>
                    <Download className="mr-2 h-4 w-4" />
                    Download setup script
                  </a>
                </Button>
              )}
              {rows.length === 0 ? (
                <Empty title="No tables to show yet" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Table</TableHead>
                        <TableHead>Columns</TableHead>
                        <TableHead>Personal data found</TableHead>
                        <TableHead>Rows</TableHead>
                        <TableHead>Sensitivity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r) => (
                        <TableRow key={r.table}>
                          <TableCell className="font-mono text-xs">{r.table}</TableCell>
                          <TableCell>{r.cols}</TableCell>
                          <TableCell className="text-xs">{r.personal}</TableCell>
                          <TableCell>{r.rowCount}</TableCell>
                          <TableCell>
                            <Status value={r.sensitivity} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {tables?.map((t) =>
                t.maskedSamples.length === 0 ? null : (
                  <details key={t.table} className="rounded-md border">
                    <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
                      {t.table} · sample rows (personal data masked)
                    </summary>
                    <div className="overflow-x-auto border-t">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {t.columns.map((c) => (
                              <TableHead key={c.name} className="text-[11px]">
                                {c.name}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {t.maskedSamples.slice(0, 5).map((s, i) => (
                            <TableRow key={i}>
                              {t.columns.map((c) => (
                                <TableCell key={c.name} className="whitespace-nowrap text-xs">
                                  {s[c.name] ?? ""}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </details>
                ),
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Card className="shadow-card">
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">demo_firm_db (PostgreSQL)</CardTitle>
          <DemoBadge label="Demo Data" />
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Synthetic inventory for walkthroughs · last sync: never (not connected to anything)
          </p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Table</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>Personal data columns</TableHead>
                  <TableHead>Sensitivity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DEMO_TABLES.map(([t, n, c, s]) => (
                  <TableRow key={t}>
                    <TableCell className="font-mono text-xs">{t}</TableCell>
                    <TableCell>{n.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">{c}</TableCell>
                    <TableCell>
                      <Status value={s} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </Page>
  );
}
