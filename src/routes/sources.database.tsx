import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, PlugZap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Page, DemoBadge, Notice, Status } from "@/components/app/kit";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/sources/database")({
  head: () => meta("Database Source", "Database connection status, sync and table inventory."),
  component: DbSource,
});

const TABLES = [
  ["clients", 1240, "name, email, nric_last4, phone", "High"],
  ["client_contacts", 3102, "name, email, phone", "Medium"],
  ["payroll", 288, "nric, salary, bank_account", "High"],
  ["invoices", 9870, "client_id, amount", "Low"],
  ["engagements", 2210, "client_id, partner", "Low"],
] as const;

function DbSource() {
  const [host, setHost] = useState("");
  const [db, setDb] = useState("");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  return (
    <Page title="Database" description="Connect a PostgreSQL database for live monitoring and PII inventory." actions={<DemoBadge label="Demo connection" />}>
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="shadow-card"><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">demo_firm_db (PostgreSQL)</CardTitle><Status value="Not Connected" /></CardHeader><CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Clearly labelled demo inventory · last sync: never (no live connection)</p>
          <Table><TableHeader><TableRow><TableHead>Table</TableHead><TableHead>Rows</TableHead><TableHead>Personal data columns</TableHead><TableHead>Sensitivity</TableHead></TableRow></TableHeader>
            <TableBody>{TABLES.map(([t, n, c, s]) => <TableRow key={t}><TableCell className="font-mono text-xs">{t}</TableCell><TableCell>{n.toLocaleString()}</TableCell><TableCell className="text-xs">{c}</TableCell><TableCell><Status value={s} /></TableCell></TableRow>)}</TableBody></Table>
        </CardContent></Card>
        <Card className="shadow-card"><CardHeader><CardTitle className="text-base">Connection test</CardTitle></CardHeader><CardContent className="space-y-3">
          <div><Label>Host</Label><Input placeholder="db.example.sg" value={host} onChange={(e) => setHost(e.target.value)} /></div>
          <div><Label>Database name</Label><Input placeholder="firm_db" value={db} onChange={(e) => setDb(e.target.value)} /></div>
          <Notice>Credentials are never entered or stored in the browser. Server-side connections are not configured yet, so tests cannot succeed.</Notice>
          <Button className="w-full" disabled={!host || !db || testing} onClick={() => { setTesting(true); setResult(null); setTimeout(() => { setTesting(false); setResult("Not connected: server-side database connectivity has not been configured for this workspace."); }, 900); }}>
            {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlugZap className="mr-2 h-4 w-4" />}Test connection</Button>
          {result && <p className="rounded-md bg-destructive-soft p-2 text-sm text-destructive">{result}</p>}
        </CardContent></Card>
      </div>
    </Page>
  );
}
