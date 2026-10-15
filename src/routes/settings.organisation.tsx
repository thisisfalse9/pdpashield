import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Page } from "@/components/app/kit";
import { setState, useCan, useStore } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/settings/organisation")({
  head: () => meta("Organisation Settings", "Company profile, timezone and default preferences."),
  component: Org,
});

function Org() {
  const org = useStore((s) => s.org);
  const can = useCan("manageUsers");
  const [f, setF] = useState(org);
  useEffect(() => setF(org), [org]);
  const valid = f.name.trim().length > 1 && /^[0-9]{8,9}[A-Z]$|^[TSR]\d{2}[A-Z]{2}\d{4}[A-Z]$/.test(f.uen);
  const S = (k: "industry" | "size" | "timezone" | "currency", opts: string[]) => <Select disabled={!can} value={f[k]} onValueChange={(v) => setF({ ...f, [k]: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{opts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>;
  return (
    <Page title="Organisation Settings" description="Applies to everyone in the organisation. Personal preferences are under Profile & Account.">
      <Card className="max-w-3xl shadow-card"><CardContent className="grid gap-4 p-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><Label>Company name</Label><Input disabled={!can} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div><Label>UEN</Label><Input disabled={!can} value={f.uen} onChange={(e) => setF({ ...f, uen: e.target.value.toUpperCase() })} />{!valid && <p className="mt-1 text-xs text-destructive">Enter a valid Singapore UEN</p>}</div>
        <div><Label>Industry</Label>{S("industry", ["Accounting & Audit", "Tax Advisory", "Corporate Secretarial", "Other"])}</div>
        <div><Label>Company size</Label>{S("size", ["1-10", "11-25", "26-50", "51+"])}</div>
        <div><Label>Timezone</Label>{S("timezone", ["Asia/Singapore", "Asia/Kuala_Lumpur", "UTC"])}</div>
        <div><Label>Currency</Label>{S("currency", ["SGD", "MYR", "USD"])}</div>
        <div><Label>Default retention (months)</Label><Input disabled={!can} type="number" min={1} value={f.retentionMonths} onChange={(e) => setF({ ...f, retentionMonths: +e.target.value })} /></div>
        <div className="sm:col-span-2"><Button disabled={!can || !valid} onClick={() => { setState(() => ({ org: f })); toast.success("Organisation settings saved"); }}>Save</Button>{!can && <span className="ml-3 text-xs text-muted-foreground">Admins only</span>}</div>
      </CardContent></Card>
    </Page>
  );
}
