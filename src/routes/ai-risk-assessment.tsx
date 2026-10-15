import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Page, Status, fmtDate, Notice } from "@/components/app/kit";
import { setState, today, uid, useCan, useStore, type AiRisk } from "@/lib/store";
import { riskScore } from "@/lib/scoring";
import { MODELS } from "@/lib/demo-events";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/ai-risk-assessment")({
  head: () => meta("AI Risk Assessment", "Assess privacy, bias, accuracy and security risk of AI models."),
  component: Risk,
});

const DIMS: [string, string][] = [
  ["privacy", "Privacy — does the model process personal data such as NRIC or salaries?"],
  ["bias", "Bias — could outputs unfairly affect particular clients or staff?"],
  ["accuracy", "Accuracy — how harmful are wrong outputs?"],
  ["security", "Security — exposure to prompt injection, data leakage or misuse?"],
  ["transparency", "Transparency — can decisions be explained to clients?"],
  ["impact", "Impact — effect on individuals if the model fails?"],
];

function Risk() {
  const list = useStore((s) => s.aiRisks);
  const canEdit = useCan("edit");
  const canApprove = useCan("approve");
  const [sel, setSel] = useState(list[0]?.id ?? "");
  const a = list.find((x) => x.id === sel);
  const [mit, setMit] = useState({ text: "", owner: "", due: "" });
  const upd = (p: Partial<AiRisk>) => a && setState((s) => ({ aiRisks: s.aiRisks.map((x) => (x.id === a.id ? { ...x, ...p } : x)) }));
  const r = a ? riskScore(a.likelihood, a.impact) : null;
  const avg = a ? Object.values(a.answers).reduce((x, y) => x + y, 0) / DIMS.length : 0;
  const top = a ? DIMS.filter(([k]) => (a.answers[k] ?? 0) >= 4).map(([k]) => k) : [];

  return (
    <Page title="AI Risk Assessment" description="Structured questionnaire with likelihood × impact scoring."
      actions={<Button disabled={!canEdit} onClick={() => { const n: AiRisk = { id: uid(), model: MODELS[1].name, at: today(), status: "Draft", answers: Object.fromEntries(DIMS.map(([k]) => [k, 3])), likelihood: 3, impact: 3, mitigations: [] }; setState((s) => ({ aiRisks: [n, ...s.aiRisks] })); setSel(n.id); }}><Plus className="mr-2 h-4 w-4" />New assessment</Button>}>
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <Card className="shadow-card"><CardContent className="space-y-1 p-2">
          {list.map((x) => <button key={x.id} onClick={() => setSel(x.id)} className={`w-full rounded-md p-3 text-left ${sel === x.id ? "bg-accent" : "hover:bg-muted"}`}><p className="text-sm font-medium">{x.model}</p><div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">{fmtDate(x.at)}<Status value={x.status} /></div></button>)}
        </CardContent></Card>
        {a && r && (
          <div className="space-y-4">
            <Card className="shadow-card"><CardHeader className="flex-row items-center justify-between gap-2">
              <Select value={a.model} disabled={!canEdit} onValueChange={(v) => upd({ model: v })}><SelectTrigger className="w-64"><SelectValue /></SelectTrigger><SelectContent>{MODELS.map((m) => <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>)}</SelectContent></Select>
              <div className="flex gap-2">
                {a.status === "Draft" && <Button disabled={!canEdit} onClick={() => { upd({ status: "In Review" }); toast.success("Submitted for review"); }}>Submit for review</Button>}
                {a.status === "In Review" && <Button disabled={!canApprove} onClick={() => { upd({ status: "Approved" }); toast.success("Approved"); }}>Approve</Button>}
                <Status value={a.status} />
              </div>
            </CardHeader><CardContent className="space-y-5">
              {DIMS.map(([k, q]) => (
                <div key={k}><div className="mb-2 flex justify-between text-sm"><span>{q}</span><b>{a.answers[k] ?? 0}/5</b></div>
                  <Slider disabled={!canEdit || a.status === "Approved"} min={1} max={5} step={1} value={[a.answers[k] ?? 1]} onValueChange={([v]) => upd({ answers: { ...a.answers, [k]: v } })} /></div>
              ))}
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Likelihood ({a.likelihood})</Label><Slider className="mt-3" disabled={!canEdit || a.status === "Approved"} min={1} max={5} step={1} value={[a.likelihood]} onValueChange={([v]) => upd({ likelihood: v })} /></div>
                <div><Label>Impact ({a.impact})</Label><Slider className="mt-3" disabled={!canEdit || a.status === "Approved"} min={1} max={5} step={1} value={[a.impact]} onValueChange={([v]) => upd({ impact: v })} /></div>
              </div>
            </CardContent></Card>
            <Card className="shadow-card"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <div className={`grid h-20 w-20 shrink-0 place-items-center rounded-xl font-display text-2xl font-semibold ${r.level === "High" ? "bg-destructive-soft text-destructive" : r.level === "Medium" ? "bg-warning-soft text-warning" : "bg-success-soft text-success"}`}>{r.score}</div>
              <div className="text-sm"><p className="font-semibold">{r.level} risk</p><p className="text-muted-foreground">Score = likelihood ({a.likelihood}) × impact ({a.impact}). ≥15 High, ≥8 Medium. Average dimension concern {avg.toFixed(1)}/5{top.length ? `; highest concerns: ${top.join(", ")}` : ""}.</p></div>
            </CardContent></Card>
            <Card className="shadow-card"><CardHeader><CardTitle className="text-base">Mitigation actions</CardTitle></CardHeader><CardContent className="space-y-2">
              {a.mitigations.map((m, i) => <div key={i} className="flex justify-between rounded-md border p-3 text-sm"><span>{m.text}</span><span className="text-xs text-muted-foreground">{m.owner} · {fmtDate(m.due)}</span></div>)}
              <div className="grid gap-2 sm:grid-cols-[1fr_150px_150px_auto]"><Input placeholder="Mitigation" value={mit.text} onChange={(e) => setMit({ ...mit, text: e.target.value })} /><Input placeholder="Owner" value={mit.owner} onChange={(e) => setMit({ ...mit, owner: e.target.value })} /><Input type="date" value={mit.due} onChange={(e) => setMit({ ...mit, due: e.target.value })} />
                <Button disabled={!canEdit || !mit.text || !mit.owner || !mit.due} onClick={() => { upd({ mitigations: [...a.mitigations, mit] }); setMit({ text: "", owner: "", due: "" }); }}><Plus className="h-4 w-4" /></Button></div>
            </CardContent></Card>
            <Notice>The risk score is a configurable internal estimate to guide discussion, not a regulatory determination.</Notice>
          </div>
        )}
      </div>
    </Page>
  );
}
