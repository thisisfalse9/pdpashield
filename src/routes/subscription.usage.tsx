import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Page, DemoBadge } from "@/components/app/kit";
import { useStore } from "@/lib/store";
import { usage } from "@/lib/usage";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/subscription/usage")({
  head: () => meta("Usage & Limits", "Scans, storage, seats and database connections against plan limits."),
  component: Usage,
});

function Usage() {
  const s = useStore((x) => x);
  return (
    <Page title="Usage & Limits" description="Limits follow your selected plan." actions={<DemoBadge />}>
      <div className="grid gap-4 md:grid-cols-2">
        {usage(s).map((u) => {
          const pct = u.limit ? Math.min(100, (u.used / u.limit) * 100) : 100;
          const warn = pct >= 80;
          return (
            <Card key={u.key} className={`shadow-card ${warn ? "border-warning" : ""}`}><CardContent className="space-y-3 p-5">
              <div className="flex justify-between"><p className="font-medium">{u.label}</p><p className="font-display">{u.used}{u.unit} <span className="text-muted-foreground">/ {u.limit > 9999 ? "∞" : u.limit}{u.unit}</span></p></div>
              <Progress value={pct} />
              {u.limit === 0 ? <p className="text-xs text-muted-foreground">Not included in your plan. <Link to="/subscription/plans" className="text-info hover:underline">Upgrade</Link></p>
                : warn ? <p className="flex items-center gap-1 text-xs text-warning"><AlertTriangle className="h-3.5 w-3.5" />{pct >= 100 ? "Limit reached" : `${Math.round(pct)}% used — approaching limit`}. <Link to="/subscription/plans" className="text-info hover:underline">See plans</Link></p>
                : <p className="text-xs text-muted-foreground">{Math.round(pct)}% used</p>}
            </CardContent></Card>
          );
        })}
      </div>
    </Page>
  );
}
