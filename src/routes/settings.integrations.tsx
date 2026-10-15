import { createFileRoute, Link } from "@tanstack/react-router";
import { Database, FileSpreadsheet, HardDrive, Mail, CreditCard, Bot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Page, Status } from "@/components/app/kit";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/settings/integrations")({
  head: () => meta("Integrations", "Connected services and planned integrations."),
  component: Int,
});

const LIST = [
  { name: "CSV / XLSX import", desc: "In-browser file parsing for scans", icon: FileSpreadsheet, status: "Connected", to: "/ai-readiness" },
  { name: "PostgreSQL", desc: "Live monitoring and table inventory", icon: Database, status: "Not Connected", to: "/sources/database" },
  { name: "Cloud document storage", desc: "Google Drive, SharePoint", icon: HardDrive, status: "Planned" },
  { name: "Email delivery", desc: "Notification emails", icon: Mail, status: "Planned" },
  { name: "Payments", desc: "Subscription billing", icon: CreditCard, status: "Planned" },
  { name: "Model endpoints", desc: "AI model telemetry", icon: Bot, status: "Planned" },
] as const;

function Int() {
  return (
    <Page title="Integrations" description="API keys and secrets are only ever kept on the server side.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LIST.map((i) => (
          <Card key={i.name} className="shadow-card"><CardContent className="space-y-3 p-5">
            <div className="flex items-start justify-between"><div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground"><i.icon className="h-5 w-5" /></div><Status value={i.status} /></div>
            <div><p className="font-medium">{i.name}</p><p className="text-sm text-muted-foreground">{i.desc}</p></div>
            {"to" in i ? <Button asChild variant="outline" size="sm"><Link to={i.to}>{i.status === "Connected" ? "Open" : "Configure"}</Link></Button> : <Button variant="outline" size="sm" disabled>Coming soon</Button>}
          </CardContent></Card>
        ))}
      </div>
    </Page>
  );
}
