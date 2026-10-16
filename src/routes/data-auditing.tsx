import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Download, FileText, Loader2, RefreshCw, Search, XCircle, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Page, DemoBadge, Notice, Stat, Status, Empty, downloadFile, toCsv } from "@/components/app/kit";
import { auditRecords } from "@/lib/demo-events";
import { monitorAuditEvents } from "@/lib/dbmon.functions";
import { useCan } from "@/lib/store";
import { useSession } from "@/lib/auth";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/data-auditing")({
  head: () => meta("Data Auditing", "Search and export data access and change records."),
  component: Audit,
});

interface Row {
  id: string;
  at: string;
  user: string;
  action: string;
  table: string;
  detail: string;
  decision: string;
  source: "Live" | "Demo";
}

function Audit() {
  const demo = useMemo<Row[]>(
    () => auditRecords().map(({ id, ...r }) => ({ ...r, id, source: "Demo" as const })),
    [],
  );
  const { session, ready } = useSession();
  const [live, setLive] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const canExport = useCan("export");
  const [q, setQ] = useState("");
  const [decision, setDecision] = useState("all");
  const [source, setSource] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = async () => {
    setBusy(true);
    setFailed(false);
    try {
      const { events } = await monitorAuditEvents();
      setLive(
        events.map((e) => ({
          id: e.id,
          at: e.at ?? new Date().toISOString(),
          user: e.actor_email || "you",
          action: e.action,
          table: e.table_name ?? "—",
          detail: e.detail,
          decision: e.action === "PII_DETECTED" ? "Flagged" : "Auto-logged",
          source: "Live" as const,
        })),
      );
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (session) void load();
    else {
      setLive([]);
      setFailed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const all = [...live, ...demo];
  const rows = all.filter((r) => (r.user + r.action + r.table + r.detail).toLowerCase().includes(q.toLowerCase())
    && (decision === "all" || r.decision === decision)
    && (source === "all" || r.source === source)
    && (!from || r.at.slice(0, 10) >= from) && (!to || r.at.slice(0, 10) <= to));

  return (
    <Page title="Data Auditing" description="Live records from your own scans, plus the demo feed. For live alerts, see Database Monitoring."
      actions={<><DemoBadge /><Button variant="outline" disabled={!canExport || !rows.length} onClick={() => downloadFile("audit_records.csv", toCsv(rows.map(({ id, ...r }) => r)))}><Download className="mr-2 h-4 w-4" />Export CSV</Button></>}>

      {!ready || !session ? null : (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" disabled={busy} onClick={() => void load()}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Reload live records
          </Button>
          <span className="text-xs text-muted-foreground">{live.length} live records</span>
        </div>
      )}

      {failed && <Notice tone="warning">Live records could not be loaded. The demo feed below is still available.</Notice>}
      <Notice tone="warning">Demo records are synthetic <b>Demo Data</b>. Live records are written by this workspace whenever a scan reads your database.</Notice>

      <Tabs defaultValue="records">
        <TabsList>
          <TabsTrigger value="records">Audit records</TabsTrigger>
          <TabsTrigger value="index">Index querying</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Stat label="Total records" value={all.length} icon={<FileText className="h-5 w-5" />} />
            <Stat label="Flagged" value={all.filter((r) => r.decision === "Flagged").length} icon={<AlertTriangle className="h-5 w-5" />} tone="warning" />
            <Stat label="Rejected" value={all.filter((r) => r.decision === "Rejected").length} icon={<XCircle className="h-5 w-5" />} tone="danger" />
            <Stat label="Approved" value={all.filter((r) => r.decision === "Approved").length} icon={<CheckCircle2 className="h-5 w-5" />} tone="success" />
            <Stat label="Live records" value={live.length} icon={<Activity className="h-5 w-5" />} />
          </div>

          <Card className="shadow-card"><CardContent className="space-y-3 p-4">
            <div className="grid gap-2 sm:grid-cols-[1fr_170px_150px_150px_150px]">
              <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search user, action, table…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
              <Select value={decision} onValueChange={setDecision}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All decisions</SelectItem>{["Flagged", "Approved", "Rejected", "Auto-logged"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
              <Select value={source} onValueChange={setSource}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All sources</SelectItem><SelectItem value="Live">Live only</SelectItem><SelectItem value="Demo">Demo only</SelectItem></SelectContent></Select>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From" />
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To" />
            </div>
            <p className="text-xs text-muted-foreground">{rows.length} records</p>
            <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Timestamp</TableHead><TableHead>User</TableHead><TableHead>Action</TableHead><TableHead>Table</TableHead><TableHead>Decision</TableHead><TableHead>Source</TableHead><TableHead>Details</TableHead></TableRow></TableHeader>
              <TableBody>{rows.map((r) => <TableRow key={`${r.source}-${r.id}`}><TableCell className="whitespace-nowrap text-xs">{new Date(r.at).toLocaleString("en-SG")}</TableCell><TableCell className="max-w-40 truncate">{r.user}</TableCell><TableCell>{r.action}</TableCell><TableCell className="font-mono text-xs">{r.table}</TableCell><TableCell><Status value={r.decision === "Flagged" ? "Flagged" : r.decision === "Rejected" ? "Blocked" : r.decision === "Approved" ? "Approved" : "Planned"} /> <span className="ml-1 text-xs text-muted-foreground">{r.decision}</span></TableCell><TableCell><Status value={r.source === "Live" ? "Connected" : "Planned"} /> <span className="ml-1 text-xs text-muted-foreground">{r.source}</span></TableCell><TableCell className="text-xs text-muted-foreground">{r.detail}</TableCell></TableRow>)}</TableBody></Table>
              {rows.length === 0 && <Empty title="No records in this range" />}</div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="index">
          <IndexDemo />
        </TabsContent>
      </Tabs>
    </Page>
  );
}

/** Simulated illustration of how the audit-trail index keeps lookups fast. */
function IndexDemo() {
  const [exp, setExp] = useState(4); // exponent: 10^3 .. 10^6 records
  const total = Math.pow(10, exp);
  const fmt = (n: number) => n.toLocaleString("en-SG");

  // Simulated model: a full scan reads every row (~2 ms per 1,000 rows).
  // An index lookup reads ~120 rows plus a fixed ~1 ms overhead.
  const scanRows = total;
  const scanMs = (total / 1000) * 2;
  const idxRows = Math.min(120, total);
  const idxMs = 1 + (idxRows / 1000) * 2;
  const maxMs = scanMs;
  const scanBar = Math.max(4, (scanMs / maxMs) * 100);
  const idxBar = Math.max(1, (idxMs / maxMs) * 100);
  const speedup = Math.max(1, Math.round(scanMs / idxMs));

  return (
    <Card className="shadow-card"><CardContent className="space-y-5 p-4">
      <div>
        <h3 className="font-heading text-lg flex items-center gap-2"><Zap className="h-5 w-5" /> Why the audit trail stays fast</h3>
        <p className="text-sm text-muted-foreground">
          Slide to pretend your firm grows. Without an index the database reads every record; with the index it jumps
          straight to your rows. This workspace's audit records are already indexed.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Audit records</span>
          <span className="font-mono">{fmt(total)}</span>
        </div>
        <Slider min={3} max={6} step={0.25} value={[exp]} onValueChange={(v: number[]) => setExp(v[0] ?? exp)} />
        <div className="flex justify-between text-xs text-muted-foreground"><span>1K</span><span>10K</span><span>100K</span><span>1M</span></div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border-2 border-foreground/15 p-4 space-y-2">
          <p className="font-semibold">Without index</p>
          <div className="h-6 w-full rounded-md bg-muted"><div className="h-6 rounded-md bg-destructive/70" style={{ width: `${scanBar}%` }} /></div>
          <p className="text-sm"><span className="font-mono">{fmt(scanRows)}</span> rows read</p>
          <p className="text-sm text-muted-foreground">≈ {scanMs >= 1000 ? `${(scanMs / 1000).toFixed(1)} s` : `${Math.round(scanMs)} ms`} per lookup — gets slower as records grow</p>
        </div>
        <div className="rounded-lg border-2 border-foreground/15 p-4 space-y-2">
          <p className="font-semibold">With index <span className="ml-1 text-xs text-muted-foreground">(used here)</span></p>
          <div className="h-6 w-full rounded-md bg-muted"><div className="h-6 rounded-md bg-primary" style={{ width: `${idxBar}%` }} /></div>
          <p className="text-sm"><span className="font-mono">{fmt(idxRows)}</span> rows read</p>
          <p className="text-sm text-muted-foreground">≈ {Math.round(idxMs)} ms per lookup — same speed at any size, about {fmt(speedup)}× faster</p>
        </div>
      </div>

      <Notice tone="warning">
        <b>Demo Data.</b> This comparison is a simulated illustration of index behaviour, not real timing measurements.
        The real database already has the matching index, so live audit loads stay quick as records pile up.
      </Notice>
    </CardContent></Card>
  );
}
