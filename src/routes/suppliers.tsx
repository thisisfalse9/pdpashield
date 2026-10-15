import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Archive, Pencil, Plus, Search, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Page, Stat, Status, DemoBadge, Empty, fmtDate } from "@/components/app/kit";
import { setState, today, uid, useCan, useStore, type Supplier } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/suppliers")({
  head: () => meta("Suppliers", "Track supplier data access, DPAs, security reviews and risk."),
  component: Suppliers,
});

const blank: Supplier = { id: "", name: "", service: "", contact: "", data: "", location: "Singapore", dpa: "Pending", review: "Not Started", risk: "Medium", nextReview: "", archived: false };

function Suppliers() {
  const list = useStore((s) => s.suppliers);
  const canEdit = useCan("edit");
  const [q, setQ] = useState("");
  const [risk, setRisk] = useState("all");
  const [showArch, setShowArch] = useState(false);
  const [edit, setEdit] = useState<Supplier | null>(null);
  const rows = list.filter((s) => s.archived === showArch && (risk === "all" || s.risk === risk) && (s.name + s.service + s.data).toLowerCase().includes(q.toLowerCase()));
  const active = list.filter((s) => !s.archived);

  function save() {
    if (!edit) return;
    if (!edit.name.trim() || !edit.service.trim()) return toast.error("Name and service type are required");
    if (edit.contact && edit.contact.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(edit.contact)) return toast.error("Contact email looks invalid");
    setState((s) => ({ suppliers: edit.id ? s.suppliers.map((x) => (x.id === edit.id ? edit : x)) : [{ ...edit, id: uid() }, ...s.suppliers] }));
    toast.success(edit.id ? "Supplier updated" : "Supplier added"); setEdit(null);
  }
  const F = (k: keyof Supplier, label: string, type = "text") => <div><Label>{label}</Label><Input type={type} value={String(edit?.[k] ?? "")} onChange={(e) => setEdit({ ...edit!, [k]: e.target.value })} /></div>;
  const S = (k: keyof Supplier, label: string, opts: string[]) => <div><Label>{label}</Label><Select value={String(edit?.[k])} onValueChange={(v) => setEdit({ ...edit!, [k]: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{opts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>;

  return (
    <Page title="Suppliers" description="Third parties that process personal data on your behalf." actions={<Button disabled={!canEdit} onClick={() => setEdit({ ...blank })}><Plus className="mr-2 h-4 w-4" />Add supplier</Button>}>
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Active suppliers" value={active.length} />
        <Stat label="High risk" value={active.filter((s) => s.risk === "High").length} tone="danger" />
        <Stat label="DPA missing" value={active.filter((s) => s.dpa !== "Signed").length} tone="warning" />
        <Stat label="Reviews due ≤30d" value={active.filter((s) => s.nextReview && (Date.parse(s.nextReview) - Date.now()) / 864e5 <= 30).length} />
      </div>
      <Card className="shadow-card"><CardContent className="space-y-3 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search suppliers…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <Select value={risk} onValueChange={setRisk}><SelectTrigger className="sm:w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All risk</SelectItem>{["Low", "Medium", "High"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
          <label className="flex items-center gap-2 text-sm"><Switch checked={showArch} onCheckedChange={setShowArch} />Archived</label>
        </div>
        <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Supplier</TableHead><TableHead>Data accessed</TableHead><TableHead>Location</TableHead><TableHead>DPA</TableHead><TableHead>Security review</TableHead><TableHead>Risk</TableHead><TableHead>Next review</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>{rows.map((s) => (
            <TableRow key={s.id}><TableCell><div className="flex items-center gap-2 font-medium">{s.name}{s.demo && <DemoBadge label="Demo" />}</div><p className="text-xs text-muted-foreground">{s.service} · {s.contact}</p></TableCell>
              <TableCell className="max-w-48 text-xs">{s.data}</TableCell><TableCell className="text-xs">{s.location}</TableCell><TableCell><Status value={s.dpa} /></TableCell>
              <TableCell><button disabled={!canEdit} title="Advance review" onClick={() => setState((x) => ({ suppliers: x.suppliers.map((y) => (y.id === s.id ? { ...y, review: y.review === "Not Started" ? "In Progress" : "Completed", nextReview: y.review === "In Progress" ? new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10) : y.nextReview } : y)) }))}><Status value={s.review} /></button></TableCell>
              <TableCell><Status value={s.risk} /></TableCell><TableCell className="text-xs">{fmtDate(s.nextReview)}</TableCell>
              <TableCell className="whitespace-nowrap"><Button size="icon" variant="ghost" disabled={!canEdit} onClick={() => setEdit(s)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" disabled={!canEdit} aria-label="Archive" onClick={() => { setState((x) => ({ suppliers: x.suppliers.map((y) => (y.id === s.id ? { ...y, archived: !y.archived } : y)) })); toast(s.archived ? "Restored" : "Archived"); }}>{s.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}</Button></TableCell></TableRow>
          ))}</TableBody></Table>{rows.length === 0 && <Empty title="No suppliers found" />}</div>
        <p className="text-xs text-muted-foreground">Click a security review status to move it forward. Completing a review schedules the next one in 12 months.</p>
      </CardContent></Card>
      <Dialog open={!!edit} onOpenChange={() => setEdit(null)}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{edit?.id ? "Edit supplier" : "Add supplier"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">{F("name", "Name *")}{F("service", "Service type *")}{F("contact", "Contact")}{F("location", "Processing / storage location")}<div className="sm:col-span-2">{F("data", "Data accessed")}</div>
            {S("dpa", "DPA status", ["Signed", "Pending", "None"])}{S("review", "Security review", ["Not Started", "In Progress", "Completed"])}{S("risk", "Risk level", ["Low", "Medium", "High"])}{F("nextReview", "Next review date", "date")}</div>
          <DialogFooter><Button onClick={save}>Save</Button></DialogFooter></DialogContent>
      </Dialog>
      <span className="hidden">{today()}</span>
    </Page>
  );
}
