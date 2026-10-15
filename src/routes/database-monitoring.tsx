import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Activity, Loader2, ShieldAlert, Zap } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Page, DemoBadge, Notice, Stat, Status, Empty } from "@/components/app/kit";
import { dbEvents } from "@/lib/demo-events";
import { monitorScan } from "@/lib/dbmon.functions";
import { alertsFromScan, scanTotals, type TableScan } from "@/lib/monitoring";
import { rememberReturn, useSession } from "@/lib/auth";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/database-monitoring")({
  head: () => meta("Database Monitoring", "Monitor database activity, risky queries and policy violations."),
  component: Mon,
});

type ScanOk = Extract<Awaited<ReturnType<typeof monitorScan>>, { ok: true }>;

function Mon() {
  const all = useMemo(() => dbEvents(), []);
  const { session, ready } = useSession();
  const [scan, setScan] = useState<ScanOk | null>(null);
  const [busy, setBusy] = useState(false);

  // Live findings come from a signed-in scan, so drop them when the session ends.
  useEffect(() => {
    if (!session) setScan(null);
  }, [session]);
  const [user, setUser] = useState("all");
  const [table, setTable] = useState("all");
  const [risk, setRisk] = useState("all");
  const [from, setFrom] = useState("");
  const [acked, setAcked] = useState<string[]>([]);
  const rows = all.filter((e) => (user === "all" || e.user === user) && (table === "all" || e.table === table) &&
    (risk === "all" || (risk === "high" ? e.risk > 60 : risk === "medium" ? e.risk > 30 && e.risk <= 60 : e.risk <= 30)) && (!from || e.at.slice(0, 10) >= from));
  const alerts = all.filter((e) => e.status !== "Allowed" && !acked.includes(e.id)).slice(0, 5);
  const uniq = (k: "user" | "table") => Array.from(new Set(all.map((e) => e[k])));

  const liveAlerts = scan ? alertsFromScan(scan.tables) : [];
  const liveTotals = scan ? scanTotals(scan.tables) : null;

  const runScan = async () => {
    setBusy(true);
    try {
      const res = await monitorScan();
      if (res.ok) {
        setScan(res);
        toast.success("Live scan complete");
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("The scan could not be completed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page title="Database Monitoring" description="Live findings from the monitored database, plus the demo activity feed. Historical decisions live in Data Auditing."
      actions={<>
        <DemoBadge />
        <Button size="sm" disabled={!session || busy} onClick={() => void runScan()}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
          Scan now
        </Button>
      </>}>

      {!ready ? null : !session ? null : (
        <>
          {!scan && <Notice>Nothing has been scanned in this session yet. Run a scan to read the live database and record it in the audit trail.</Notice>}
          {liveTotals && (
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="Tables scanned" value={liveTotals.tables} icon={<Activity className="h-5 w-5" />} />
              <Stat label="Personal-data columns" value={liveTotals.findings} icon={<AlertTriangle className="h-5 w-5" />} tone="warning" />
              <Stat label="High risk" value={liveTotals.high} icon={<ShieldAlert className="h-5 w-5" />} tone="danger" />
            </div>
          )}
          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-base">Live alerts · {scan?.host}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {liveAlerts.length === 0 && <Empty title={scan ? "No personal-data alerts from the last scan" : "Run a scan to raise live alerts"} />}
              {liveAlerts.map((a) => (
                <div key={a.id} className="flex flex-col gap-2 rounded-md border border-l-4 border-l-destructive p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm">
                    <b>{a.title}</b>
                    <p className="text-xs text-muted-foreground">{a.detail} · risk {a.risk}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => { setAcked([...acked, a.id]); toast.success("Alert acknowledged"); }}>Acknowledge</Button>
                </div>
              ))}
            </CardContent>
          </Card>
          {scan && <LiveFindings tables={scan.tables} />}
        </>
      )}

      <Notice tone="warning">The feed below is simulated <b>Demo Data</b>, kept for walkthroughs. It is not read from any database.</Notice>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Events (demo)" value={all.length} icon={<Activity className="h-5 w-5" />} />
        <Stat label="Flagged" value={all.filter((e) => e.status === "Flagged").length} icon={<AlertTriangle className="h-5 w-5" />} tone="warning" />
        <Stat label="Blocked" value={all.filter((e) => e.status === "Blocked").length} icon={<ShieldAlert className="h-5 w-5" />} tone="danger" />
      </div>
      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base">Suspicious activity alerts (demo)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {alerts.length === 0 && <Empty title="No open alerts" />}
          {alerts.map((a) => (
            <div key={a.id} className="flex flex-col gap-2 rounded-md border border-l-4 border-l-destructive p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm"><b>{a.user}</b> — {a.detail}<p className="text-xs text-muted-foreground">Possible policy violation: {a.table === "payroll" ? "Access to payroll outside need-to-know" : a.action === "EXPORT" ? "Bulk export of personal data" : "High-risk modification"} · risk {a.risk}</p></div>
              <Button size="sm" variant="outline" onClick={() => { setAcked([...acked, a.id]); toast.success("Alert acknowledged"); }}>Acknowledge</Button>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="shadow-card">
        <CardContent className="space-y-3 p-4">
          <div className="grid gap-2 sm:grid-cols-4">
            <Select value={user} onValueChange={setUser}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All users</SelectItem>{uniq("user").map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select>
            <Select value={table} onValueChange={setTable}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All tables</SelectItem>{uniq("table").map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select>
            <Select value={risk} onValueChange={setRisk}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All risk</SelectItem><SelectItem value="high">High (&gt;60)</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low (≤30)</SelectItem></SelectContent></Select>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
          </div>
          <div className="overflow-x-auto">
            <Table><TableHeader><TableRow><TableHead>Timestamp</TableHead><TableHead>User</TableHead><TableHead>Database / table</TableHead><TableHead>SQL action</TableHead><TableHead>Risk</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>{rows.map((e) => (
                <TableRow key={e.id}><TableCell className="whitespace-nowrap text-xs">{new Date(e.at).toLocaleString("en-SG")}</TableCell><TableCell>{e.user}</TableCell><TableCell className="font-mono text-xs">firm_db.{e.table}</TableCell><TableCell><code className="text-xs">{e.action}</code></TableCell>
                  <TableCell><div className="flex items-center gap-2"><div className="h-1.5 w-16 rounded bg-muted"><div className={`h-full rounded ${e.risk > 60 ? "bg-destructive" : e.risk > 30 ? "bg-warning" : "bg-success"}`} style={{ width: `${e.risk}%` }} /></div><span className="text-xs">{e.risk}</span></div></TableCell>
                  <TableCell><Status value={e.status} /></TableCell></TableRow>
              ))}</TableBody></Table>
            {rows.length === 0 && <Empty title="No events match these filters" />}
          </div>
        </CardContent>
      </Card>
    </Page>
  );
}

function LiveFindings({ tables }: { tables: TableScan[] }) {
  return (
    <Card className="shadow-card">
      <CardHeader><CardTitle className="text-base">Per-table findings</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {tables.map((t) => (
          <details key={t.table} className="rounded-md border">
            <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-3 py-2 text-sm">
              <span className="font-mono text-xs">{t.table}</span>
              <Status value={t.sensitivity} />
              <span className="text-xs text-muted-foreground">
                {t.rowCount.toLocaleString()} rows · {t.findings.length} personal-data columns · privacy risk {t.privacyRisk}
              </span>
            </summary>
            <div className="space-y-1 border-t px-3 py-2 text-xs text-muted-foreground">
              {t.findings.length === 0 && <p>No personal data detected in {t.sampled} sampled rows.</p>}
              {t.findings.map((f) => (
                <p key={`${f.column}-${f.type}`}>
                  <b className="text-foreground">{f.label ?? f.type}</b> in <code>{f.column}</code> — {f.count} of{" "}
                  {t.sampled || 1} sampled rows. {f.action}
                </p>
              ))}
            </div>
          </details>
        ))}
      </CardContent>
    </Card>
  );
}
