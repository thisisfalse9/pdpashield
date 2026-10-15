import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Page, Status, DemoBadge, fmtDate } from "@/components/app/kit";
import { pushNotice, setState, today, uid, useCan, useStore, type Policy, type PolicyStatus } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/policies")({
  head: () => meta("Policies", "Create, review, approve and publish PDPA policies with version history."),
  component: Policies,
});

const TEMPLATES: Record<string, string> = {
  "Blank": "",
  "Data Protection Policy": "1. Purpose\n2. Scope\n3. Collection, use and disclosure\n4. Consent and withdrawal\n5. Access and correction\n6. Protection and retention\n7. DPO contact",
  "Access Control Policy": "1. Least privilege\n2. MFA requirement\n3. Quarterly access reviews\n4. Joiner/mover/leaver process",
  "Data Breach Response Plan": "1. Detect & contain\n2. Assess (C.A.R.E.)\n3. Notify PDPC within 3 calendar days if notifiable\n4. Notify affected individuals\n5. Review",
};
const FLOW: PolicyStatus[] = ["Draft", "Pending Approval", "Approved", "Published"];

function Policies() {
  const policies = useStore((s) => s.policies);
  const controls = useStore((s) => s.controls);
  const me = useStore((s) => s.profile.name);
  const canEdit = useCan("edit");
  const canApprove = useCan("approve");
  const [sel, setSel] = useState<string | null>(policies[0]?.id ?? null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", template: "Blank", roles: "All staff" });
  const [comment, setComment] = useState("");
  const p = policies.find((x) => x.id === sel);

  const update = (id: string, patch: Partial<Policy>) => setState((s) => ({ policies: s.policies.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));

  function advance(next: PolicyStatus) {
    if (!p) return;
    if ((next === "Approved" || next === "Published") && !canApprove) return toast.error("Your role cannot approve or publish policies");
    if (next === "Published" && !p.effective) return toast.error("Set an effective date before publishing");
    update(p.id, { status: next, history: next === "Published" ? [...p.history] : p.history });
    pushNotice(`${p.title} moved to ${next}`, "policy");
    toast.success(`Moved to ${next}`);
  }

  return (
    <Page title="Policies" description="Draft → Pending Approval → Approved → Published."
      actions={<Button disabled={!canEdit} onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" />New policy</Button>}>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="shadow-card">
          <CardContent className="space-y-1 p-2">
            {policies.map((x) => (
              <button key={x.id} onClick={() => setSel(x.id)} className={`flex w-full items-start gap-3 rounded-md p-3 text-left ${sel === x.id ? "bg-accent" : "hover:bg-muted"}`}>
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{x.title}</p><p className="text-xs text-muted-foreground">v{x.version} · {x.owner}</p></div>
                <Status value={x.status} />
              </button>
            ))}
          </CardContent>
        </Card>
        {p && (
          <Card className="shadow-card">
            <CardHeader className="gap-3">
              <div className="flex flex-wrap items-center gap-2"><CardTitle>{p.title}</CardTitle><Status value={p.status} />{p.demo && <DemoBadge />}</div>
              <div className="flex flex-wrap gap-1">
                {FLOW.map((st, i) => <span key={st} className={`rounded-full px-3 py-1 text-xs ${FLOW.indexOf(p.status) >= i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{st}</span>)}
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div><Label>Owner</Label><Input disabled={!canEdit} value={p.owner} onChange={(e) => update(p.id, { owner: e.target.value })} /></div>
                <div><Label>Applicable roles</Label><Input disabled={!canEdit} value={p.roles.join(", ")} onChange={(e) => update(p.id, { roles: e.target.value.split(",").map((r) => r.trim()) })} /></div>
                <div><Label>Effective date</Label><Input type="date" disabled={!canEdit} value={p.effective} onChange={(e) => update(p.id, { effective: e.target.value })} /></div>
              </div>
              <div><Label>Policy text</Label><Textarea rows={7} disabled={!canEdit || p.status === "Published"} value={p.body} onChange={(e) => update(p.id, { body: e.target.value })} /></div>
              <div>
                <Label>Linked compliance controls</Label>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {controls.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm">
                      <Checkbox disabled={!canEdit} checked={p.controls.includes(c.id)} onCheckedChange={(v) => update(p.id, { controls: v ? [...p.controls, c.id] : p.controls.filter((x) => x !== c.id) })} />{c.obligation}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {p.status === "Draft" && <Button disabled={!canEdit} onClick={() => advance("Pending Approval")}>Submit for approval</Button>}
                {p.status === "Pending Approval" && <><Button disabled={!canApprove} onClick={() => advance("Approved")}>Approve</Button><Button variant="outline" disabled={!canApprove} onClick={() => advance("Draft")}>Return to draft</Button></>}
                {p.status === "Approved" && <Button disabled={!canApprove} onClick={() => advance("Published")}>Publish</Button>}
                {p.status === "Published" && <Button variant="outline" disabled={!canEdit} onClick={() => { update(p.id, { status: "Draft", version: p.version + 1, history: [...p.history, { version: p.version + 1, at: today(), note: "New revision started" }] }); toast("New draft revision created"); }}>Start new revision</Button>}
                {!canApprove && p.status !== "Draft" && <p className="self-center text-xs text-muted-foreground">Approval requires Admin or DPO role.</p>}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 text-sm font-semibold">Reviewer comments</h4>
                  <div className="space-y-2">
                    {p.comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
                    {p.comments.map((c, i) => <div key={i} className="rounded-md bg-muted p-2 text-sm"><b>{c.by}</b> <span className="text-xs text-muted-foreground">{fmtDate(c.at)}</span><p>{c.text}</p></div>)}
                    <div className="flex gap-2"><Input placeholder="Add comment…" value={comment} onChange={(e) => setComment(e.target.value)} /><Button variant="outline" disabled={!comment.trim()} onClick={() => { update(p.id, { comments: [...p.comments, { by: me, text: comment, at: today() }] }); setComment(""); }}>Add</Button></div>
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-semibold">Version history</h4>
                  <ol className="space-y-2 border-l pl-4">
                    {[...p.history].reverse().map((h) => <li key={h.version} className="text-sm"><b>v{h.version}</b> · {fmtDate(h.at)}<p className="text-muted-foreground">{h.note}</p></li>)}
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader><DialogTitle>New policy</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Template</Label><Select value={form.template} onValueChange={(v) => setForm({ ...form, template: v, title: v === "Blank" ? form.title : v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(TEMPLATES).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Applicable roles</Label><Input value={form.roles} onChange={(e) => setForm({ ...form, roles: e.target.value })} /></div>
          </div>
          <DialogFooter><Button disabled={form.title.trim().length < 3} onClick={() => {
            const np: Policy = { id: uid(), title: form.title.trim(), owner: me, roles: form.roles.split(",").map((r) => r.trim()), status: "Draft", effective: "", version: 1, body: TEMPLATES[form.template], controls: [], comments: [], history: [{ version: 1, at: today(), note: form.template === "Blank" ? "Created manually" : `From template: ${form.template}` }] };
            setState((s) => ({ policies: [np, ...s.policies] })); setSel(np.id); setCreating(false); setForm({ title: "", template: "Blank", roles: "All staff" }); toast.success("Draft created");
          }}>Create draft</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
