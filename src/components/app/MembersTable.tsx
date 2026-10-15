import { useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Status } from "./kit";
import { setState, uid, useCan, useStore, type Role } from "@/lib/store";

export const ROLES: Role[] = ["Admin", "DPO", "Compliance Officer", "Business User"];

export function MembersTable({ seatLimit, editableRoles }: { seatLimit?: number; editableRoles?: boolean }) {
  const members = useStore((s) => s.members);
  const can = useCan("manageUsers");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("Business User");
  const full = seatLimit !== undefined && members.length >= seatLimit;
  function invite() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error("Enter a valid email");
    if (members.some((m) => m.email === email)) return toast.error("Already a member");
    if (full) return toast.error("No seats available on your plan");
    setState((s) => ({ members: [...s.members, { id: uid(), name: email.split("@")[0], email, role, status: "Invited" }] }));
    setEmail(""); toast.success("Invitation recorded", { description: "Email delivery is not connected; no email was sent." });
  }
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_200px_auto]">
        <Input placeholder="colleague@firm.sg" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!can} />
        <Select value={role} onValueChange={(v) => setRole(v as Role)} disabled={!can}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
        <Button onClick={invite} disabled={!can || full}><UserPlus className="mr-2 h-4 w-4" />Invite</Button>
      </div>
      {!can && <p className="text-xs text-muted-foreground">Only Admins can manage members.</p>}
      <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
        <TableBody>{members.map((m) => (
          <TableRow key={m.id}><TableCell className="font-medium">{m.name}</TableCell><TableCell className="text-xs">{m.email}</TableCell>
            <TableCell>{editableRoles && can ? <Select value={m.role} onValueChange={(v) => { if (m.role === "Admin" && members.filter((x) => x.role === "Admin").length === 1) return toast.error("At least one Admin is required"); setState((s) => ({ members: s.members.map((x) => (x.id === m.id ? { ...x, role: v as Role } : x)) })); toast.success("Role updated"); }}><SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger><SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select> : m.role}</TableCell>
            <TableCell><Status value={m.status} /></TableCell>
            <TableCell><Button size="icon" variant="ghost" disabled={!can || m.id === "m1"} aria-label="Remove" onClick={() => { setState((s) => ({ members: s.members.filter((x) => x.id !== m.id) })); toast("Member removed"); }}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell></TableRow>
        ))}</TableBody></Table>
    </div>
  );
}
