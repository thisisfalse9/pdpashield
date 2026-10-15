import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Check, X, FileText, Database, ShieldCheck, Crown, Tag, UserRound, CalendarDays, FileSearch, Settings2, ScrollText, Users, Headphones,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Page, DemoBadge, Notice } from "@/components/app/kit";
import { setState, useCan, useStore, type State } from "@/lib/store";
import { PLANS } from "@/lib/seed";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/subscription/plans")({
  head: () => meta("Plans & Billing", "Compare PDPA Shield Basic, Standard and Premium plans."),
  component: Plans,
});

type K = State["plan"];
type V = boolean | string;
const TIERS: { k: K; icon: LucideIcon }[] = [
  { k: "starter", icon: Database },
  { k: "professional", icon: ShieldCheck },
  { k: "enterprise", icon: Crown },
];
const FEATURES: [LucideIcon, string, V, V, V][] = [
  [Tag, "Price/month", true, true, true],
  [ShieldCheck, "PDPA compliance checklist", true, true, true],
  [UserRound, "Consent management", true, true, true],
  [CalendarDays, "Deadline reminders", true, true, true],
  [FileSearch, "AI document analysis", false, true, true],
  [ShieldCheck, "Automated compliance reports", "Basic", "Advanced", "Advanced"],
  [Settings2, "Compliance gap detection", false, true, true],
  [ScrollText, "Audit logs", false, true, true],
  [Database, "Data breach response support", false, "Basic", "Advanced"],
  [Users, "Role-based access control", false, false, true],
  [Headphones, "Priority support & onboarding", false, false, true],
];

const box = "rounded-lg border-2 border-foreground shadow-brutal";

function Cell({ v }: { v: V }) {
  if (v === true) return <span className="inline-grid h-7 w-7 place-items-center rounded-full bg-brand text-brand-foreground"><Check className="h-4 w-4" strokeWidth={3} /></span>;
  if (v === false) return <span className="inline-grid h-7 w-7 place-items-center rounded-full bg-destructive text-destructive-foreground"><X className="h-4 w-4" strokeWidth={3} /></span>;
  return <span className="font-semibold">{v}</span>;
}

function Plans() {
  const plan = useStore((s) => s.plan);
  const billing = useStore((s) => s.billing);
  const canManage = useCan("manageUsers");
  const [target, setTarget] = useState<K | null>(null);
  const annual = billing === "annual";
  const order: K[] = ["trial", "starter", "professional", "enterprise"];

  return (
    <Page title="Plans & Billing" description="Proposed demo pricing for small accounting firms." actions={<><DemoBadge label="Simulated" /><label className="flex items-center gap-2 text-sm font-semibold">Monthly<Switch checked={annual} onCheckedChange={(v) => setState(() => ({ billing: v ? "annual" : "monthly" }))} />Annual <span className="text-xs text-success">2 months free</span></label></>}>
      <Notice tone="warning">Plan changes here are simulated. No payment is taken and no real subscription changes.</Notice>
      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[860px] grid-cols-[1.5fr_1fr_1fr_1fr] gap-3">
          <div className={`${box} overflow-hidden bg-card`}>
            <div className="flex h-[124px] items-center gap-3 border-b-2 border-foreground bg-brand px-5 text-brand-foreground">
              <FileText className="h-9 w-9" /><span className="font-display text-3xl">Features</span>
            </div>
            <div className="space-y-1.5 p-2">
              {FEATURES.map(([Icon, label]) => (
                <div key={label} className="flex h-11 items-center gap-3 rounded-md border-2 border-foreground/15 bg-accent/40 px-2">
                  <span className="grid h-8 w-8 place-items-center rounded-md bg-brand text-brand-foreground"><Icon className="h-4 w-4" /></span>
                  <span className="text-sm font-semibold">{label}</span>
                </div>
              ))}
            </div>
          </div>
          {TIERS.map(({ k, icon: Icon }, i) => {
            const p = PLANS[k]; const cur = plan === k; const price = (p.price ?? 0) * (annual ? 10 : 1);
            return (
              <div key={k} className={`${box} flex flex-col overflow-hidden bg-card ${cur ? "ring-4 ring-warning" : ""}`}>
                <div className="flex h-[124px] flex-col items-center justify-center gap-2 border-b-2 border-foreground bg-brand px-3 text-brand-foreground">
                  <div className="flex items-center gap-2"><Icon className="h-7 w-7" /><span className="font-display text-2xl">{p.name}</span></div>
                  <div className="rounded-md border-2 border-foreground bg-card px-4 py-1 text-foreground shadow-brutal-sm">
                    <span className="font-display text-xl">S${price}</span> <span className="text-xs font-semibold">/{annual ? "year" : "month"}</span>
                  </div>
                </div>
                <div className="space-y-1.5 p-2">
                  {FEATURES.map((f) => (
                    <div key={f[1]} className="grid h-11 place-items-center rounded-md border-2 border-foreground/15 bg-accent/20"><Cell v={f[2 + i] as V} /></div>
                  ))}
                </div>
                <div className="mt-auto p-2">
                  <Button className="w-full border-2 border-foreground shadow-brutal-sm" variant={cur ? "outline" : "default"} disabled={cur || !canManage} onClick={() => setTarget(k)}>
                    {cur ? "Current plan" : order.indexOf(k) > order.indexOf(plan) ? "Upgrade" : "Downgrade"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Prices exclude GST. {!canManage && "Only Admins can change plans."}</p>
      <AlertDialog open={!!target} onOpenChange={() => setTarget(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Switch to {target && PLANS[target].name}?</AlertDialogTitle><AlertDialogDescription>This is a simulated change for demo purposes. No payment will be charged.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { setState(() => ({ plan: target! })); toast.success(`Now on ${PLANS[target!].name} (simulated)`); }}>Confirm (simulated)</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </Page>
  );
}
