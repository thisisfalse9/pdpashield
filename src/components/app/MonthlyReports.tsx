import { useState } from "react";
import { Download, FileText, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoBadge } from "@/components/app/kit";
import { setState, today, useCan, useStore } from "@/lib/store";
import { changeFromPrevious, monthKey, monthLabel, reportText, upsertReport, type MonthlyReport } from "@/lib/reports";
import type { ScoreWeights } from "@/lib/scoring";

function download(r: MonthlyReport, org: string) {
  const blob = new Blob([reportText(r, org)], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `PDPA-Score-${r.month}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function SaveMonthButton({ parts, weights, overall }: { parts: { manual: number; monitoring: number; auditing: number }; weights: ScoreWeights; overall: number }) {
  const s = useStore((x) => x);
  const canEdit = useCan("edit");
  const month = monthKey();
  const exists = (s.monthlyReports ?? []).some((r) => r.month === month);
  return (
    <Button size="sm" disabled={!canEdit} onClick={() => {
      const r: MonthlyReport = {
        month, ...parts, overall, weights: { ...weights },
        answered: s.controls.filter((c) => s.answers[c.id]).length, totalControls: s.controls.length,
        openTasks: s.tasks.filter((t) => !t.done).length, note: "", savedBy: s.profile.name, savedAt: today(),
      };
      setState((x) => ({ monthlyReports: upsertReport(x.monthlyReports ?? [], r) }));
      toast.success(`${exists ? "Updated" : "Saved"} report for ${monthLabel(month)}`);
    }}>
      <Save className="mr-2 h-4 w-4" />{exists ? "Update this month's report" : "Save this month's report"}
    </Button>
  );
}

export function MonthlyReports() {
  const list = useStore((x) => x.monthlyReports ?? []);
  const org = useStore((x) => x.org.name);
  const canEdit = useCan("edit");
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">Monthly score reports</CardTitle>
        <DemoBadge />
      </CardHeader>
      <CardContent className="space-y-2">
        {list.length === 0 && <p className="text-sm text-muted-foreground">No reports yet. Use "Save this month's report" above.</p>}
        {list.map((r) => {
          const diff = changeFromPrevious(list, r.month);
          return (
            <div key={r.month} className="rounded-md border">
              <div className="flex flex-wrap items-center gap-3 p-3">
                <FileText className="h-5 w-5 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{monthLabel(r.month)}{r.month === monthKey() && <span className="ml-2 text-xs text-muted-foreground">(this month)</span>}</p>
                  <p className="text-xs text-muted-foreground">Saved by {r.savedBy} · {r.savedAt}</p>
                </div>
                <span className="font-display text-2xl">{r.overall}</span>
                <span className={`w-12 text-sm font-semibold ${diff == null ? "text-muted-foreground" : diff >= 0 ? "text-success" : "text-destructive"}`}>{diff == null ? "—" : `${diff >= 0 ? "+" : ""}${diff}`}</span>
                <Button size="sm" variant="outline" onClick={() => setOpen(open === r.month ? null : r.month)}>{open === r.month ? "Hide" : "View"}</Button>
                <Button size="sm" variant="outline" onClick={() => download(r, org)}><Download className="h-4 w-4" /></Button>
                <Button size="sm" variant="outline" disabled={!canEdit} aria-label="Delete report" onClick={() => { setState((x) => ({ monthlyReports: (x.monthlyReports ?? []).filter((y) => y.month !== r.month) })); toast.success("Report deleted"); }}><Trash2 className="h-4 w-4" /></Button>
              </div>
              {open === r.month && (
                <div className="grid gap-3 border-t p-3 text-sm sm:grid-cols-2">
                  <p>Manual assessment: <b>{r.manual}</b> (weight {r.weights.manual})</p>
                  <p>Database monitoring: <b>{r.monitoring}</b> (weight {r.weights.monitoring})</p>
                  <p>Data auditing: <b>{r.auditing}</b> (weight {r.weights.auditing})</p>
                  <p>Controls answered: <b>{r.answered}/{r.totalControls}</b> · Open tasks: <b>{r.openTasks}</b></p>
                  <Input className="sm:col-span-2" disabled={!canEdit} placeholder="Notes for this month" value={r.note}
                    onChange={(e) => setState((x) => ({ monthlyReports: (x.monthlyReports ?? []).map((y) => (y.month === r.month ? { ...y, note: e.target.value } : y)) }))} />
                </div>
              )}
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground">One report per month; saving again in the same month replaces it. Internal estimates only.</p>
      </CardContent>
    </Card>
  );
}
