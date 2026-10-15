import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Page, DemoBadge, Notice, Stat, Status } from "@/components/app/kit";
import { modelMetrics } from "@/lib/demo-events";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/model-monitoring")({
  head: () => meta("Model Monitoring", "Model request volume, latency, error rate and drift."),
  component: MM,
});

type Pt = ReturnType<typeof modelMetrics>[number];

function Chart({ data, k, title, color }: { data: Pt[]; k: keyof Pt; title: string; color: string }) {
  return (
    <Card className="shadow-card"><CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader><CardContent className="h-48">
      <ResponsiveContainer><LineChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="d" fontSize={10} stroke="var(--muted-foreground)" /><YAxis fontSize={10} stroke="var(--muted-foreground)" /><Tooltip /><Line dataKey={k} stroke={color} dot={false} strokeWidth={2} /></LineChart></ResponsiveContainer>
    </CardContent></Card>
  );
}

function MM() {
  const [days, setDays] = useState("30");
  const data = useMemo(() => modelMetrics(+days), [days]);
  const last = data[data.length - 1];
  const alerts = data.filter((d) => d.errors > 2 || d.latency > 320).map((d) => ({ d: d.d, msg: d.errors > 2 ? `Error rate ${d.errors}% above 2% threshold` : `Latency ${d.latency}ms above 320ms` })).reverse();
  return (
    <Page title="Model Monitoring" description="Operational health of AI models used by the firm."
      actions={<><DemoBadge /><Select value={days} onValueChange={setDays}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7">Last 7 days</SelectItem><SelectItem value="14">Last 14 days</SelectItem><SelectItem value="30">Last 30 days</SelectItem></SelectContent></Select></>}>
      <Notice tone="warning">Connection status: <Status value="Not Connected" /> — no model endpoint is connected. All metrics are simulated <b>Demo Data</b>, not live production telemetry.</Notice>
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Requests (last day)" value={last.requests.toLocaleString()} />
        <Stat label="Latency" value={`${last.latency} ms`} tone="warning" />
        <Stat label="Error rate" value={`${last.errors}%`} tone="danger" />
        <Stat label="Drift (PSI)" value={last.drift} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Chart data={data} k="requests" title="Request volume" color="var(--primary)" />
        <Chart data={data} k="latency" title="Latency (ms)" color="var(--brand)" />
        <Chart data={data} k="errors" title="Error rate (%)" color="var(--destructive)" />
        <Chart data={data} k="drift" title="Data drift indicator" color="var(--warning)" />
      </div>
      <Card className="shadow-card"><CardHeader><CardTitle className="text-base">Alert history</CardTitle></CardHeader><CardContent className="divide-y">
        {alerts.length === 0 ? <p className="text-sm text-muted-foreground">No alerts in this range.</p> : alerts.map((a, i) => <div key={i} className="flex justify-between py-2 text-sm"><span>{a.msg}</span><span className="text-muted-foreground">{a.d}</span></div>)}
      </CardContent></Card>
    </Page>
  );
}
