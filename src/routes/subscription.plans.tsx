import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Page, DemoBadge, Notice } from "@/components/app/kit";
import { setState, useCan, useStore, type State } from "@/lib/store";
import { PLANS } from "@/lib/seed";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/subscription/plans")({
  head: () => meta("Plans & Billing", "Compare PDPA Shield plans and simulate upgrades."),
  component: Plans,
});

type K = State["plan"];
const ORDER: K[] = ["trial", "starter", "professional", "enterprise"];
const ROWS: [string, (p: (typeof PLANS)[K]) => string][] = [
  ["Monthly PII scans", (p) => (p.scans > 9999 ? "Unlimited" : String(p.scans))], ["Document storage", (p) => `${p.storageGb} GB`], ["Team seats", (p) => String(p.seats)],
  ["Database connections", (p) => String(p.dbs)], ["Compliance workflows", (p) => p.workflows], ["Audit features", (p) => p.audit], ["Integrations", (p) => p.integrations], ["Support level", (p) => p.support],
];

function Plans() {
  const plan = useStore((s) => s.plan);
  const billing = useStore((s) => s.billing);
  const canManage = useCan("manageUsers");
  const [target, setTarget] = useState<K | null>(null);
  const price = (k: K) => { const p = PLANS[k].price; if (p === null) return "Custom"; if (p === 0) return "S$0"; return billing === "annual" ? `S$${p * 10}/yr` : `S$${p}/mo`; };
  return (
    <Page title="Plans & Billing" description="Proposed demo pricing for small accounting firms." actions={<><DemoBadge label="Simulated" /><label className="flex items-center gap-2 text-sm">Monthly<Switch checked={billing === "annual"} onCheckedChange={(v) => setState(() => ({ billing: v ? "annual" : "monthly" }))} />Annual <span className="text-xs text-success">2 months free</span></label></>}>
      <Notice tone="warning">Plan changes here are simulated. No payment is taken and no real subscription changes.</Notice>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ORDER.map((k) => {
          const p = PLANS[k]; const cur = plan === k;
          return (
            <Card key={k} className={`shadow-card ${k === "professional" ? "border-primary ring-1 ring-primary" : ""}`}>
              <CardHeader><div className="flex items-center justify-between"><CardTitle>{p.name}</CardTitle>{k === "professional" && <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">Popular</span>}</div>
                <p className="font-display text-3xl font-semibold">{price(k)}</p><p className="text-xs text-muted-foreground">{k === "trial" ? "14 days" : k === "enterprise" ? "Talk to us" : "excl. GST"}</p></CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-1.5 text-sm">{ROWS.slice(0, 4).map(([l, f]) => <li key={l} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-success" />{f(p)} {l.toLowerCase()}</li>)}</ul>
                <Button className="w-full" variant={cur ? "outline" : "default"} disabled={cur || !canManage} onClick={() => k === "enterprise" ? toast("Enterprise enquiry noted (demo)", { description: "No message is actually sent." }) : setTarget(k)}>
                  {cur ? "Current plan" : k === "enterprise" ? "Contact sales" : ORDER.indexOf(k) > ORDER.indexOf(plan) ? "Upgrade" : "Downgrade"}</Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {!canManage && <p className="text-xs text-muted-foreground">Only Admins can change plans.</p>}
      <Card className="shadow-card"><CardContent className="overflow-x-auto p-0">
        <Table><TableHeader><TableRow><TableHead>Feature</TableHead>{ORDER.map((k) => <TableHead key={k}>{PLANS[k].name}</TableHead>)}</TableRow></TableHeader>
          <TableBody>{ROWS.map(([l, f]) => <TableRow key={l}><TableCell className="font-medium">{l}</TableCell>{ORDER.map((k) => <TableCell key={k}>{f(PLANS[k])}</TableCell>)}</TableRow>)}</TableBody></Table>
      </CardContent></Card>
      <AlertDialog open={!!target} onOpenChange={() => setTarget(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Switch to {target && PLANS[target].name}?</AlertDialogTitle><AlertDialogDescription>This is a simulated change for demo purposes. No payment will be charged.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { setState(() => ({ plan: target! })); toast.success(`Now on ${PLANS[target!].name} (simulated)`); }}>Confirm (simulated)</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </Page>
  );
}
