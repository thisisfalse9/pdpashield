import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Download, FileText, Loader2, RefreshCw, Search, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    </Page>
  );
}
