import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Page, Status, Notice } from "@/components/app/kit";
import { resetDemo, setState, useStore } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/settings/security")({
  head: () => meta("Security & Privacy", "Account security controls, sessions and data retention."),
  component: Sec,
});

function Sec() {
  const timeout = useStore((s) => s.sessionTimeout);
  return (
    <Page title="Security & Privacy" description="Only controls that are actually available are shown as active.">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card"><CardHeader><CardTitle className="text-base">Account security</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
          <div className="flex justify-between"><span>Sign-in</span><Status value="Not Connected" /></div>
          <div className="flex justify-between"><span>Multi-factor authentication</span><Status value="Planned" /></div>
          <div className="flex justify-between"><span>Single sign-on</span><Status value="Planned" /></div>
          <div><Label>Idle session timeout (minutes, preference)</Label><Input type="number" min={5} max={240} value={timeout} onChange={(e) => setState(() => ({ sessionTimeout: Math.max(5, Math.min(240, +e.target.value || 5)) }))} /></div>
        </CardContent></Card>
        <Card className="shadow-card"><CardHeader><CardTitle className="text-base">Current session</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
          <p>Browser: {typeof navigator !== "undefined" ? navigator.userAgent.split(") ")[0].replace("(", "· ") : "—"}</p>
          <p className="text-muted-foreground">Demo session · data stored in this browser only</p>
        </CardContent></Card>
        <Card className="shadow-card lg:col-span-2"><CardHeader><CardTitle className="text-base">Data & privacy</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
          <p>Uploaded files and scan results are processed in your browser and are not sent to any external AI service.</p>
          <Notice>Encryption-at-rest and server-side retention controls will apply once a backend is enabled. They are not active today.</Notice>
          <Button variant="destructive" onClick={() => { if (confirm("Delete all demo data stored in this browser?")) { resetDemo(); toast.success("Local data cleared"); } }}>Clear local workspace data</Button>
        </CardContent></Card>
      </div>
    </Page>
  );
}
