import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Paperclip, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Page, Notice, ScoreRing, Status, fmtDate } from "@/components/app/kit";
import { setState, today, uid, useCan, useStore } from "@/lib/store";
import { calcScore, type Answer } from "@/lib/scoring";
import { meta } from "@/lib/meta";
import { CombinedCard } from "@/components/app/CombinedScoreCard";
import { MonthlyReports } from "@/components/app/MonthlyReports";

export const Route = createFileRoute("/pdpa-score")({
  head: () => meta("PDPA Score", "Self-assess PDPA obligations, attach evidence and track remediation."),
  component: Score,
});

const OPTS: Answer[] = ["Yes", "Partial", "No", "N/A"];

function Score() {
  const s = useStore((x) => x);
  const canEdit = useCan("edit");
  const score = calcScore(s.controls, s.answers);
  const [task, setTask] = useState({ title: "", owner: "", due: "" });
  const answered = s.controls.filter((c) => s.answers[c.id]).length;

  return (
    <Page title="PDPA Score" description="Internal readiness estimate across the PDPA's main obligations."
      actions={<Button disabled={!canEdit || answered < s.controls.length} onClick={() => { setState((x) => ({ assessments: [...x.assessments, { id: uid(), at: today(), score, by: x.profile.name }] })); toast.success(`Assessment saved: ${score}`); }}><Save className="mr-2 h-4 w-4" />Save assessment</Button>}>
      <Notice>This is an internal readiness estimate calculated from your answers and configured control weights. It is not an official PDPC assessment, audit or certification.</Notice>
      <CombinedCard manual={score} />
      <MonthlyReports />
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <Card className="shadow-card"><CardContent className="flex flex-col items-center gap-3 p-6">
          <ScoreRing value={score} size={150} label="Readiness" />
          <p className="text-sm text-muted-foreground">{answered}/{s.controls.length} controls answered</p>
          <div className="w-full"><Label className="text-xs">Next scheduled assessment</Label><Input type="date" disabled={!canEdit} value={s.nextAssessment} onChange={(e) => setState(() => ({ nextAssessment: e.target.value }))} /></div>
        </CardContent></Card>
        <Card className="shadow-card"><CardHeader><CardTitle className="text-base">Score history</CardTitle></CardHeader><CardContent className="h-52">
          <ResponsiveContainer><LineChart data={s.assessments.map((a) => ({ d: fmtDate(a.at), v: a.score }))}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="d" fontSize={11} stroke="var(--muted-foreground)" /><YAxis domain={[0, 100]} fontSize={11} stroke="var(--muted-foreground)" /><Tooltip /><Line dataKey="v" stroke="var(--primary)" strokeWidth={2} /></LineChart></ResponsiveContainer>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="check">
        <TabsList><TabsTrigger value="check">Checklist</TabsTrigger><TabsTrigger value="tasks">Remediation ({s.tasks.filter((t) => !t.done).length})</TabsTrigger><TabsTrigger value="history">History</TabsTrigger></TabsList>
        <TabsContent value="check" className="space-y-3">
          {s.controls.map((c) => (
            <Card key={c.id} className="shadow-card"><CardContent className="space-y-3 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-accent-foreground">{c.obligation} · weight {c.weight}</p><p className="mt-1 text-sm">{c.question}</p></div>
                <div className="flex shrink-0 gap-1">
                  {OPTS.map((o) => (
                    <button key={o} disabled={!canEdit} onClick={() => setState((x) => ({ answers: { ...x.answers, [c.id]: o } }))}
                      className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${s.answers[c.id] === o ? (o === "Yes" ? "border-success bg-success-soft text-success" : o === "Partial" ? "border-warning bg-warning-soft text-warning" : o === "No" ? "border-destructive bg-destructive-soft text-destructive" : "border-foreground/30 bg-muted") : "hover:bg-muted"}`}>
                      {o === "N/A" ? "Not Applicable" : o}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="relative"><Paperclip className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" disabled={!canEdit} placeholder="Evidence (document name or link)" value={s.evidence[c.id] ?? ""} onChange={(e) => setState((x) => ({ evidence: { ...x.evidence, [c.id]: e.target.value } }))} /></div>
                <Input disabled={!canEdit} placeholder="Reviewer comment" value={s.reviewerNotes[c.id] ?? ""} onChange={(e) => setState((x) => ({ reviewerNotes: { ...x.reviewerNotes, [c.id]: e.target.value } }))} />
              </div>
            </CardContent></Card>
          ))}
        </TabsContent>
        <TabsContent value="tasks">
          <Card className="shadow-card"><CardContent className="space-y-3 p-4">
            {s.tasks.map((t) => {
              const overdue = !t.done && t.due < today();
              return (
                <div key={t.id} className="flex items-center gap-3 rounded-md border p-3">
                  <Checkbox checked={t.done} disabled={!canEdit} onCheckedChange={(v) => setState((x) => ({ tasks: x.tasks.map((y) => (y.id === t.id ? { ...y, done: !!v } : y)) }))} />
                  <div className="min-w-0 flex-1"><p className={`text-sm ${t.done ? "line-through text-muted-foreground" : ""}`}>{t.title}</p><p className="text-xs text-muted-foreground">{t.owner} · due {fmtDate(t.due)}</p></div>
                  <Status value={t.done ? "Completed" : overdue ? "Overdue" : "Open"} />
                </div>
              );
            })}
            <div className="grid gap-2 sm:grid-cols-[1fr_160px_160px_auto]">
              <Input placeholder="New task" value={task.title} onChange={(e) => setTask({ ...task, title: e.target.value })} />
              <Input placeholder="Owner" value={task.owner} onChange={(e) => setTask({ ...task, owner: e.target.value })} />
              <Input type="date" value={task.due} onChange={(e) => setTask({ ...task, due: e.target.value })} />
              <Button disabled={!canEdit || !task.title || !task.owner || !task.due} onClick={() => { setState((x) => ({ tasks: [...x.tasks, { id: uid(), ...task, done: false }] })); setTask({ title: "", owner: "", due: "" }); toast.success("Task added"); }}><Plus className="h-4 w-4" /></Button>
            </div>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="history">
          <Card className="shadow-card"><CardContent className="divide-y p-0">
            {[...s.assessments].reverse().map((a) => <div key={a.id} className="flex items-center justify-between p-4 text-sm"><span>{fmtDate(a.at)} · {a.by}</span><span className="font-display text-lg font-semibold">{a.score}</span></div>)}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </Page>
  );
}
