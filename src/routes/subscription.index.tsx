import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Page, DemoBadge, Stat, Status, Notice } from "@/components/app/kit";
import { useStore } from "@/lib/store";
import { PLANS } from "@/lib/seed";
import { usage } from "@/lib/usage";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/subscription/")({
  head: () => meta("Subscription Overview", "Current plan, renewal and usage summary."),
  component: Sub,
});

function Sub() {
  const s = useStore((x) => x);
  const p = PLANS[s.plan];
  const price = p.price === null ? "Custom" : `S$${s.billing === "annual" ? p.price * 10 : p.price}`;
  return (
    <Page title="Subscription Overview" description="Demo subscription — no real billing is connected." actions={<><DemoBadge /><Button asChild><Link to="/subscription/plans">Upgrade plan</Link></Button></>}>
      <Notice tone="warning">Plans and prices shown are proposed demo pricing. No payment provider is connected and no charges occur.</Notice>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Current plan" value={p.name} />
        <Stat label="Status" value={<Status value={s.plan === "trial" ? "In Progress" : "Active"} />} hint={s.plan === "trial" ? "Trial" : "Simulated"} />
        <Stat label="Billing cycle" value={s.billing === "annual" ? "Annual" : "Monthly"} hint={price + (s.billing === "annual" ? "/year" : "/month")} />
        <Stat label="Next renewal" value="01 Nov 2026" hint="Demo date" />
      </div>
      <Card className="shadow-card"><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">Usage summary</CardTitle><Button asChild variant="ghost" size="sm"><Link to="/subscription/usage">Details</Link></Button></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
        {usage(s).map((u) => <div key={u.key}><div className="mb-1 flex justify-between text-sm"><span>{u.label}</span><span>{u.used}{u.unit} / {u.limit}{u.unit}</span></div><Progress value={u.limit ? (u.used / u.limit) * 100 : 0} /></div>)}
      </CardContent></Card>
    </Page>
  );
}
