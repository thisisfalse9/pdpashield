import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, ShieldAlert, Activity } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Page, DemoBadge, Notice, Stat, Status, Empty } from "@/components/app/kit";
import { dbEvents } from "@/lib/demo-events";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/database-monitoring")({
  head: () => meta("Database Monitoring", "Monitor database activity, risky queries and policy violations."),
  component: Mon,
});

function Mon() {
  const all = useMemo(() => dbEvents(), []);
  const [user, setUser] = useState("all");
  const [table, setTable] = useState("all");
  const [risk, setRisk] = useState("all");
  const [from, setFrom] = useState("");
  const [acked, setAcked] = useState<string[]>([]);
  const rows = all.filter((e) => (user === "all" || e.user === user) && (table === "all" || e.table === table) &&
    (risk === "all" || (risk === "high" ? e.risk > 60 : risk === "medium" ? e.risk > 30 && e.risk <= 60 : e.risk <= 30)) && (!from || e.at.slice(0, 10) >= from));
  const alerts = all.filter((e) => e.status !== "Allowed" && !acked.includes(e.id)).slice(0, 5);
  const uniq = (k: "user" | "table") => Array.from(new Set(all.map((e) => e[k])));

  return (
    <Page title="Database Monitoring" description="Current activity and alerts. Historical decisions live in Data Auditing." actions={<DemoBadge />}>
      <Notice tone="warning">No live database is connected. All events below are simulated <b>Demo Data</b>. Connect a database under Sources → Database to enable real monitoring.</Notice>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Events (demo)" value={all.length} icon={<Activity className="h-5 w-5" />} />
        <Stat label="Flagged" value={all.filter((e) => e.status === "Flagged").length} icon={<AlertTriangle className="h-5 w-5" />} tone="warning" />
        <Stat label="Blocked" value={all.filter((e) => e.status === "Blocked").length} icon={<ShieldAlert className="h-5 w-5" />} tone="danger" />
      </div>
      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base">Suspicious activity alerts</CardTitle></CardHeader>
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
