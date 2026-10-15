import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Page, DemoBadge, Notice, Status, Empty, downloadFile, toCsv } from "@/components/app/kit";
import { auditRecords } from "@/lib/demo-events";
import { useCan } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/data-auditing")({
  head: () => meta("Data Auditing", "Search and export historical data access and change records."),
  component: Audit,
});

function Audit() {
  const all = useMemo(() => auditRecords(), []);
  const canExport = useCan("export");
  const [q, setQ] = useState("");
  const [decision, setDecision] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const rows = all.filter((r) => (r.user + r.action + r.table + r.detail).toLowerCase().includes(q.toLowerCase()) && (decision === "all" || r.decision === decision) && (!from || r.at.slice(0, 10) >= from) && (!to || r.at.slice(0, 10) <= to));
  return (
    <Page title="Data Auditing" description="Historical audit records. For live alerts, see Database Monitoring."
      actions={<><DemoBadge /><Button variant="outline" disabled={!canExport || !rows.length} onClick={() => downloadFile("audit_records.csv", toCsv(rows.map(({ id, ...r }) => r)))}><Download className="mr-2 h-4 w-4" />Export CSV</Button></>}>
      <Notice tone="warning">Automated audit integration is under development. Records shown are synthetic <b>Demo Data</b>.</Notice>
      <Card className="shadow-card"><CardContent className="space-y-3 p-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_180px_160px_160px]">
          <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search user, action, table…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <Select value={decision} onValueChange={setDecision}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All decisions</SelectItem>{["Approved", "Rejected", "Auto-logged"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To" />
        </div>
        <p className="text-xs text-muted-foreground">{rows.length} records</p>
        <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Timestamp</TableHead><TableHead>User</TableHead><TableHead>Action</TableHead><TableHead>Table</TableHead><TableHead>Decision</TableHead><TableHead>Details</TableHead></TableRow></TableHeader>
          <TableBody>{rows.map((r) => <TableRow key={r.id}><TableCell className="whitespace-nowrap text-xs">{new Date(r.at).toLocaleString("en-SG")}</TableCell><TableCell>{r.user}</TableCell><TableCell>{r.action}</TableCell><TableCell className="font-mono text-xs">{r.table}</TableCell><TableCell><Status value={r.decision === "Auto-logged" ? "Planned" : r.decision === "Rejected" ? "Blocked" : "Approved"} /> <span className="ml-1 text-xs text-muted-foreground">{r.decision}</span></TableCell><TableCell className="text-xs text-muted-foreground">{r.detail}</TableCell></TableRow>)}</TableBody></Table>
          {rows.length === 0 && <Empty title="No records in this range" />}</div>
      </CardContent></Card>
    </Page>
  );
}
