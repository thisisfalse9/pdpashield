import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Page, DemoBadge } from "@/components/app/kit";
import { MembersTable } from "@/components/app/MembersTable";
import { useStore } from "@/lib/store";
import { PLANS } from "@/lib/seed";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/subscription/seats")({
  head: () => meta("Team & Seats", "Seat usage and member invitations for your plan."),
  component: Seats,
});

function Seats() {
  const members = useStore((s) => s.members);
  const plan = useStore((s) => s.plan);
  const limit = PLANS[plan].seats;
  return (
    <Page title="Team & Seats" description="Seats used against your plan. Manage roles under Settings → Team & Permissions." actions={<DemoBadge />}>
      <Card className="shadow-card"><CardContent className="space-y-2 p-5">
        <div className="flex justify-between text-sm"><span>{members.length} of {limit} seats occupied · {Math.max(0, limit - members.length)} available</span><Link to="/subscription/plans" className="text-info hover:underline">Need more seats?</Link></div>
        <Progress value={(members.length / limit) * 100} />
      </CardContent></Card>
      <Card className="shadow-card"><CardContent className="p-4"><MembersTable seatLimit={limit} /></CardContent></Card>
    </Page>
  );
}
