import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Page, downloadFile, toCsv } from "@/components/app/kit";
import { setState, useCan, useStore, type QItem } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/security-questionnaire")({
  head: () => meta("Security Questionnaire", "Answer standard security questions with evidence and owners."),
  component: SQ,
});

function SQ() {
  const q = useStore((s) => s.questionnaire);
  const canEdit = useCan("edit");
  const canExport = useCan("export");
  const done = q.filter((x) => x.resp).length;
  const upd = (id: string, p: Partial<QItem>) => setState((s) => ({ questionnaire: s.questionnaire.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
  const sections = Array.from(new Set(q.map((x) => x.section)));
  return (
    <Page title="Security Questionnaire" description="Standard questions clients and auditors ask. Answers feed the Trust Center."
      actions={<Button variant="outline" disabled={!canExport} onClick={() => downloadFile("security_questionnaire.csv", toCsv(q.map(({ id, ...r }) => r)))}><Download className="mr-2 h-4 w-4" />Export report</Button>}>
      <Card className="shadow-card"><CardContent className="space-y-2 p-5"><div className="flex justify-between text-sm"><span>Completion</span><span>{done}/{q.length}</span></div><Progress value={(done / q.length) * 100} /></CardContent></Card>
      {sections.map((sec) => (
        <div key={sec} className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{sec}</h3>
          {q.filter((x) => x.section === sec).map((x) => (
            <Card key={x.id} className="shadow-card"><CardContent className="space-y-3 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-medium">{x.q}</p>
                <Select value={x.resp || undefined} disabled={!canEdit} onValueChange={(v) => upd(x.id, { resp: v as QItem["resp"] })}><SelectTrigger className="w-40"><SelectValue placeholder="Respond…" /></SelectTrigger><SelectContent>{["Implemented", "Partial", "Planned", "N/A"].map((r) => <SelectItem key={r} value={r}>{r === "N/A" ? "Not Applicable" : r}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2 sm:grid-cols-4">
                <Input disabled={!canEdit} placeholder="Evidence" value={x.evidence} onChange={(e) => upd(x.id, { evidence: e.target.value })} />
                <Input disabled={!canEdit} placeholder="Notes" value={x.notes} onChange={(e) => upd(x.id, { notes: e.target.value })} />
                <Input disabled={!canEdit} placeholder="Owner" value={x.owner} onChange={(e) => upd(x.id, { owner: e.target.value })} />
                <Input disabled={!canEdit} type="date" value={x.reviewDate} onChange={(e) => upd(x.id, { reviewDate: e.target.value })} />
              </div>
            </CardContent></Card>
          ))}
        </div>
      ))}
    </Page>
  );
}
