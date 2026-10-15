import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoBadge, ScoreRing } from "@/components/app/kit";
import { auditingScore, combinedScore, DEFAULT_WEIGHTS, monitoringScore, type ScoreWeights } from "@/lib/scoring";
import { auditRecords, dbEvents } from "@/lib/demo-events";

export function CombinedCard({ manual }: { manual: number }) {
  const [w, setW] = useState<ScoreWeights>(DEFAULT_WEIGHTS);
  const parts = useMemo(() => ({ manual, monitoring: monitoringScore(dbEvents()), auditing: auditingScore(auditRecords()) }), [manual]);
  const total = combinedScore(parts, w);
  const rows: { key: keyof ScoreWeights; label: string; hint: string }[] = [
    { key: "manual", label: "Manual assessment", hint: "Your answers below" },
    { key: "monitoring", label: "Database monitoring", hint: "Share of events not flagged or blocked · Demo Data" },
    { key: "auditing", label: "Data auditing", hint: "Share of audit records not rejected · Demo Data" },
  ];
  const sum = w.manual + w.monitoring + w.auditing;
  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">Overall PDPA score</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setW(DEFAULT_WEIGHTS)}>Weighted 50/25/25</Button>
          <Button size="sm" variant="outline" onClick={() => setW({ manual: 1, monitoring: 1, auditing: 1 })}>Direct (equal)</Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-[200px_1fr]">
        <div className="flex flex-col items-center gap-2">
          <ScoreRing value={total} size={150} label="Overall" />
          <DemoBadge />
        </div>
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.key} className="grid grid-cols-[1fr_auto_auto] items-center gap-3">
              <div><p className="font-semibold">{r.label}</p><p className="text-xs text-muted-foreground">{r.hint}</p></div>
              <span className="font-display text-xl">{parts[r.key]}</span>
              <div className="flex items-center gap-1">
                <Input type="number" min={0} className="w-20" value={w[r.key]} onChange={(e) => setW({ ...w, [r.key]: Math.max(0, Number(e.target.value) || 0) })} />
                <span className="w-12 text-xs text-muted-foreground">{sum ? Math.round((w[r.key] / sum) * 100) : 0}%</span>
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">Overall = weighted average of the three scores. Change the weights to suit your firm.</p>
        </div>
      </CardContent>
    </Card>
  );
}
