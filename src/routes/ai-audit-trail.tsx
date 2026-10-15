import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Page, DemoBadge, Notice, Status, Empty } from "@/components/app/kit";
import { MODELS, modelEvents } from "@/lib/demo-events";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/ai-audit-trail")({
  head: () => meta("AI Model Audit Trail", "Model registry with configuration, approval and deployment history."),
  component: Trail,
});

function Trail() {
  const events = useMemo(() => modelEvents(), []);
  const [q, setQ] = useState("");
  const [model, setModel] = useState("all");
  const [type, setType] = useState("all");
  const rows = events.filter((e) => (model === "all" || e.model === model) && (type === "all" || e.type === type) && (e.detail + e.user + e.model).toLowerCase().includes(q.toLowerCase()));
  return (
    <Page title="AI Model Audit Trail" description="Who changed, approved or deployed which model, and when." actions={<DemoBadge />}>
      <Notice tone="warning">No model platform is connected. Registry entries and events are synthetic <b>Demo Data</b>.</Notice>
      <Card className="shadow-card"><CardHeader><CardTitle className="text-base">Model registry</CardTitle></CardHeader><CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MODELS.map((m) => <button key={m.name} onClick={() => setModel(model === m.name ? "all" : m.name)} className={`rounded-lg border p-4 text-left transition ${model === m.name ? "border-primary bg-accent" : "hover:bg-muted"}`}>
            <p className="font-medium">{m.name}</p><p className="text-xs text-muted-foreground">v{m.version} · {m.owner}</p><div className="mt-2"><Status value={m.status === "Production" ? "Active" : m.status === "Retired" ? "Archived" : m.status === "Staging" ? "In Progress" : "Under Review"} /></div></button>)}
        </div>
      </CardContent></Card>
      <Card className="shadow-card"><CardContent className="space-y-3 p-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_200px_200px]">
          <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search history…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <Select value={model} onValueChange={setModel}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All models</SelectItem>{MODELS.map((m) => <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>)}</SelectContent></Select>
          <Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All events</SelectItem>{["Config change", "Approval", "Deployment", "User action", "Rollback"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
        </div>
        <Table><TableHeader><TableRow><TableHead>Timestamp</TableHead><TableHead>Model</TableHead><TableHead>Event</TableHead><TableHead>User</TableHead><TableHead>Detail</TableHead></TableRow></TableHeader>
          <TableBody>{rows.map((e) => <TableRow key={e.id}><TableCell className="whitespace-nowrap text-xs">{new Date(e.at).toLocaleString("en-SG")}</TableCell><TableCell>{e.model} <span className="text-xs text-muted-foreground">v{e.version}</span></TableCell><TableCell>{e.type}</TableCell><TableCell>{e.user}</TableCell><TableCell className="text-xs text-muted-foreground">{e.detail}</TableCell></TableRow>)}</TableBody></Table>
        {rows.length === 0 && <Empty title="No events found" />}
      </CardContent></Card>
    </Page>
  );
}
