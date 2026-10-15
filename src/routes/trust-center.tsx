import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Page, Notice, Status } from "@/components/app/kit";
import { useStore } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/trust-center")({
  head: () => meta("Trust Center", "Your firm's security and privacy posture, policies and evidence."),
  component: Trust,
});

function Trust() {
  const org = useStore((s) => s.org);
  const policies = useStore((s) => s.policies);
  const q = useStore((s) => s.questionnaire);
  const docs = useStore((s) => s.docs);
  const map = (r: string) => (r === "Implemented" ? "Configured" : r === "Partial" ? "Under Review" : r === "Planned" ? "Planned" : "Not Verified");
  return (
    <Page title="Trust Center" description={`Security and privacy overview prepared by ${org.name}. Statuses are self-reported by your firm.`}>
      <Notice>Statuses reflect your own Security Questionnaire answers. Nothing here is independently audited or certified.</Notice>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card"><CardHeader><CardTitle className="text-base">Security control status</CardTitle></CardHeader><CardContent className="divide-y">
          {q.map((x) => <div key={x.id} className="flex items-center justify-between gap-3 py-2 text-sm"><span>{x.q}</span><Status value={map(x.resp)} /></div>)}
          <Link to="/security-questionnaire" className="block pt-3 text-sm text-info hover:underline">Update in Security Questionnaire →</Link>
        </CardContent></Card>
        <div className="space-y-4">
          <Card className="shadow-card"><CardHeader><CardTitle className="text-base">Published policies</CardTitle></CardHeader><CardContent className="space-y-2">
            {policies.filter((p) => p.status === "Published").map((p) => <div key={p.id} className="flex justify-between text-sm"><span>{p.title} v{p.version}</span><Status value="Published" /></div>)}
            {policies.filter((p) => p.status !== "Published").map((p) => <div key={p.id} className="flex justify-between text-sm text-muted-foreground"><span>{p.title}</span><Status value="Under Review" /></div>)}
          </CardContent></Card>
          <Card className="shadow-card"><CardHeader><CardTitle className="text-base">Compliance evidence</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
            {docs.filter((d) => d.status === "Reviewed").map((d) => <div key={d.id} className="flex justify-between"><span>{d.name}</span><Status value="Reviewed" /></div>)}
          </CardContent></Card>
          <Card className="shadow-card"><CardHeader><CardTitle className="text-base">Incident response</CardTitle></CardHeader><CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>Data breaches are assessed promptly. Notifiable breaches are reported to the PDPC within 3 calendar days of assessment, per the firm's Data Breach Management Plan.</p>
            <p>Status: <Status value={policies.find((p) => p.title.includes("Breach"))?.status === "Published" ? "Configured" : "Under Review"} /></p>
          </CardContent></Card>
          <Card className="shadow-card"><CardHeader><CardTitle className="text-base">Data handling & retention</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">
            Client records are retained for {org.retentionMonths} months after engagement ends, then disposed of. Retention policy status: <Status value={policies.find((p) => p.title.includes("Retention"))?.status === "Published" ? "Configured" : "Under Review"} />
          </CardContent></Card>
        </div>
      </div>
    </Page>
  );
}
