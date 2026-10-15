import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CalendarClock, FileCheck2, ScanSearch, Upload, ClipboardCheck, BellRing } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Page, Stat, Notice, ScoreRing, Status, fmtDate } from "@/components/app/kit";
import { useStore } from "@/lib/store";
import { calcScore } from "@/lib/scoring";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/")({
  head: () => meta("Dashboard", "PDPA readiness, open issues, approvals and recent PII scans at a glance."),
  component: Dashboard,
});

function Dashboard() {
  const s = useStore((x) => x);
  const score = calcScore(s.controls, s.answers);
  const open = s.controls.filter((c) => s.answers[c.id] === "No" || s.answers[c.id] === "Partial").length;
  const pending = s.policies.filter((p) => p.status === "Pending Approval").length;
  const lastScan = s.scans[0];
  const trend = [...s.assessments].map((a) => ({ d: fmtDate(a.at).slice(3), score: a.score }));
  const byOb = s.controls.map((c) => ({ name: c.obligation.split(" ")[0], v: s.answers[c.id] === "Yes" ? 100 : s.answers[c.id] === "Partial" ? 50 : s.answers[c.id] === "No" ? 0 : null })).filter((x) => x.v !== null);
  const activity = [
    ...s.policies.flatMap((p) => p.history.map((h) => ({ at: h.at, text: `${p.title} v${h.version}: ${h.note}` }))),
    ...s.scans.map((x) => ({ at: x.at, text: `Scanned ${x.file}${x.masked ? " (masked)" : ""}` })),
    ...s.docs.map((d) => ({ at: d.uploaded, text: `Uploaded ${d.name}` })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);

  return (
    <Page title={`Good day, ${s.profile.name.split(" ")[0]}`} description={s.org.name}
      actions={<>
        <Button asChild variant="outline"><Link to="/documents"><Upload className="mr-2 h-4 w-4" />Upload data</Link></Button>
        <Button asChild variant="outline"><Link to="/pdpa-score"><ClipboardCheck className="mr-2 h-4 w-4" />Start assessment</Link></Button>
        <Button asChild><Link to="/database-monitoring"><BellRing className="mr-2 h-4 w-4" />Review alerts</Link></Button>
      </>}>
      <Card className="overflow-hidden border-0 bg-hero text-primary-foreground shadow-card">
        <CardContent className="flex flex-col items-start gap-6 p-6 md:flex-row md:items-center">
          <div className="rounded-full bg-card p-2 text-foreground"><ScoreRing value={score} label="Readiness" /></div>
          <div className="flex-1">
            <p className="text-sm opacity-80">Overall PDPA Readiness</p>
            <h3 className="mt-1 text-3xl font-semibold">{score >= 75 ? "Strong" : score >= 50 ? "Developing" : "At risk"}</h3>
            <p className="mt-2 max-w-xl text-sm opacity-80">Internal estimate from your self-assessment of {s.controls.length} PDPA controls. Not an official PDPC assessment or certification.</p>
          </div>
          <div className="grid grid-cols-2 gap-6 text-center">
            <div><div className="font-display text-3xl font-semibold">{lastScan?.aiReadiness ?? "—"}</div><div className="text-xs opacity-80">AI Readiness</div></div>
            <div><div className="font-display text-3xl font-semibold">{s.tasks.filter((t) => !t.done).length}</div><div className="text-xs opacity-80">Remediation tasks</div></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Open issues" value={open} hint="Controls answered No / Partial" icon={<AlertTriangle className="h-5 w-5" />} tone="danger" />
        <Stat label="Pending approvals" value={pending} hint="Policies awaiting sign-off" icon={<FileCheck2 className="h-5 w-5" />} tone="warning" />
        <Stat label="Next assessment" value={fmtDate(s.nextAssessment)} hint="Scheduled review" icon={<CalendarClock className="h-5 w-5" />} />
        <Stat label="PII scans" value={s.scans.length} hint={lastScan ? `Last: ${lastScan.file}` : "None yet"} icon={<ScanSearch className="h-5 w-5" />} tone="success" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Readiness trend</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <AreaChart data={trend}>
                <defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--brand)" stopOpacity={0.4} /><stop offset="1" stopColor="var(--brand)" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="d" fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis domain={[0, 100]} fontSize={12} stroke="var(--muted-foreground)" />
                <Tooltip />
                <Area dataKey="score" stroke="var(--brand)" strokeWidth={2} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-base">Recent activity</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {activity.map((a, i) => (
              <div key={i} className="flex gap-3 text-sm"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" /><div><p>{a.text}</p><p className="text-xs text-muted-foreground">{fmtDate(a.at)}</p></div></div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-base">Control coverage</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer>
              <BarChart data={byOb}><XAxis dataKey="name" fontSize={11} stroke="var(--muted-foreground)" /><YAxis fontSize={11} domain={[0, 100]} stroke="var(--muted-foreground)" /><Tooltip /><Bar dataKey="v" fill="var(--primary)" radius={[4, 4, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">Recent PII scans</CardTitle><Button asChild size="sm" variant="ghost"><Link to="/ai-readiness">New scan</Link></Button></CardHeader>
          <CardContent className="space-y-2">
            {s.scans.slice(0, 4).map((x) => (
              <div key={x.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <div className="min-w-0"><p className="truncate font-medium">{x.file}</p><p className="text-xs text-muted-foreground">{x.rows} rows · {x.findings} findings · {fmtDate(x.at)}</p></div>
                <Status value={x.masked ? "Resolved" : x.privacyRisk > 60 ? "High" : "Medium"} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Notice>Scores are internal assessment estimates based on your answers and scans. They are not official PDPC certifications.</Notice>
    </Page>
  );
}
