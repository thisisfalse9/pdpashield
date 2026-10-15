import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Page, Notice, Status } from "@/components/app/kit";
import { setState, useStore } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/settings/notifications")({
  head: () => meta("Notifications", "Choose which compliance events notify you."),
  component: N,
});

const ITEMS = [["deadlines", "Compliance deadlines", "Assessment and supplier review due dates"], ["scans", "Scan results", "When a PII scan completes"], ["risk", "Risk alerts", "Flagged database or model activity"], ["approvals", "Policy approvals", "Policies waiting on you"]] as const;

function N() {
  const prefs = useStore((s) => s.notifyPrefs);
  const set = (k: string, ch: "inApp" | "email", v: boolean) => { setState((s) => ({ notifyPrefs: { ...s.notifyPrefs, [k]: { ...s.notifyPrefs[k], [ch]: v } } })); toast.success("Preference saved"); };
  return (
    <Page title="Notifications" description="Preferences are saved; delivery depends on connected channels.">
      <Notice>In-app notifications appear in the bell menu. Email delivery is <Status value="Not Connected" /> — email preferences are saved for when it's enabled.</Notice>
      <Card className="max-w-3xl shadow-card"><CardContent className="divide-y p-0">
        <div className="grid grid-cols-[1fr_80px_80px] px-5 py-3 text-xs font-semibold uppercase text-muted-foreground"><span>Event</span><span className="text-center">In-app</span><span className="text-center">Email</span></div>
        {ITEMS.map(([k, l, d]) => <div key={k} className="grid grid-cols-[1fr_80px_80px] items-center px-5 py-4"><div><p className="text-sm font-medium">{l}</p><p className="text-xs text-muted-foreground">{d}</p></div>
          <div className="flex justify-center"><Switch checked={prefs[k]?.inApp} onCheckedChange={(v) => set(k, "inApp", v)} /></div><div className="flex justify-center"><Switch checked={prefs[k]?.email} onCheckedChange={(v) => set(k, "email", v)} /></div></div>)}
      </CardContent></Card>
    </Page>
  );
}
