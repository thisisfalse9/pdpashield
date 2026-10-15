import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Page, Notice, Status } from "@/components/app/kit";
import { setState, useStore } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/settings/profile")({
  head: () => meta("Profile & Account", "Your display name and account preferences."),
  component: Profile,
});

function Profile() {
  const p = useStore((s) => s.profile);
  const [f, setF] = useState(p);
  useEffect(() => setF(p), [p]);
  return (
    <Page title="Profile & Account" description="Personal settings. Organisation-wide settings are under Organisation Settings.">
      <Card className="max-w-2xl shadow-card"><CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader><CardContent className="space-y-4">
        <div><Label>Display name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div><Label>Email</Label><div className="flex items-center gap-2"><Input value={f.email} disabled /><Status value="Not Verified" /></div><p className="mt-1 text-xs text-muted-foreground">Email verification is available once sign-in is enabled.</p></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Language</Label><Select value={f.lang} onValueChange={(v) => setF({ ...f, lang: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["English", "中文", "Bahasa Melayu"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Date format</Label><Select value={f.dateFormat} onValueChange={(v) => setF({ ...f, dateFormat: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["DD/MM/YYYY", "YYYY-MM-DD"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <Button disabled={f.name.trim().length < 2} onClick={() => { setState(() => ({ profile: { ...f, name: f.name.trim() } })); toast.success("Profile saved"); }}>Save changes</Button>
      </CardContent></Card>
      <div className="max-w-2xl"><Notice>Password change is not available yet — this workspace does not have sign-in enabled.</Notice></div>
    </Page>
  );
}
