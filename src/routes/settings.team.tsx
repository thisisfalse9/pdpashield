import { createFileRoute } from "@tanstack/react-router";
import { Check, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Page, Notice } from "@/components/app/kit";
import { MembersTable, ROLES } from "@/components/app/MembersTable";
import { PERMISSIONS, type Perm } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/settings/team")({
  head: () => meta("Team & Permissions", "Roles and access control for your team."),
  component: Team,
});

const PERMS: [Perm, string][] = [["view", "View"], ["upload", "Upload"], ["edit", "Edit"], ["approve", "Approve"], ["export", "Export"], ["manageUsers", "Manage users"]];

function Team() {
  return (
    <Page title="Team & Permissions" description="Who can do what. Seat counts are under Subscription → Team & Seats.">
      <Notice tone="warning">Permissions are currently applied in the interface only (demo). Server-side enforcement needs sign-in and a backend, which aren't enabled yet. Use the profile menu to preview each role.</Notice>
      <Card className="shadow-card"><CardHeader><CardTitle className="text-base">Role permissions</CardTitle></CardHeader><CardContent className="overflow-x-auto">
        <Table><TableHeader><TableRow><TableHead>Role</TableHead>{PERMS.map(([, l]) => <TableHead key={l} className="text-center">{l}</TableHead>)}</TableRow></TableHeader>
          <TableBody>{ROLES.map((r) => <TableRow key={r}><TableCell className="font-medium">{r}</TableCell>{PERMS.map(([p]) => <TableCell key={p} className="text-center">{PERMISSIONS[r].includes(p) ? <Check className="mx-auto h-4 w-4 text-success" /> : <Minus className="mx-auto h-4 w-4 text-muted-foreground" />}</TableCell>)}</TableRow>)}</TableBody></Table>
      </CardContent></Card>
      <Card className="shadow-card"><CardHeader><CardTitle className="text-base">Members</CardTitle></CardHeader><CardContent><MembersTable editableRoles /></CardContent></Card>
    </Page>
  );
}
