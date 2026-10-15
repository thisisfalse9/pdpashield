import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Download, Eye, Search, Trash2, Upload, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Page, Status, DemoBadge, Empty, fmtDate } from "@/components/app/kit";
import { setState, today, uid, useCan, useStore, type Doc } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/documents")({
  head: () => meta("Documents", "Manage compliance documents, versions, review status and links."),
  component: Documents,
});

const ALLOWED = ["pdf", "docx", "csv", "xlsx"];
const CATS = ["Forms", "Contracts", "Records", "Policies", "Evidence"];

function Documents() {
  const docs = useStore((s) => s.docs);
  const owner = useStore((s) => s.profile.name);
  const policies = useStore((s) => s.policies);
  const suppliers = useStore((s) => s.suppliers);
  const canUpload = useCan("upload");
  const canEdit = useCan("edit");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState("all");
  const [preview, setPreview] = useState<Doc | null>(null);
  const [del, setDel] = useState<Doc | null>(null);
  const [linkDoc, setLinkDoc] = useState<Doc | null>(null);
  const [linkTo, setLinkTo] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const rows = docs.filter((d) => d.name.toLowerCase().includes(q.toLowerCase()) && (cat === "all" || d.category === cat) && (status === "all" || d.status === status));

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    for (const f of Array.from(files)) {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      if (!ALLOWED.includes(ext)) { toast.error(`${f.name}: unsupported file type`, { description: "Use PDF, DOCX, CSV or XLSX." }); continue; }
      if (f.size > 10 * 1024 * 1024) { toast.error(`${f.name} is larger than 10 MB`); continue; }
      let content: string | undefined;
      if (f.size < 600_000) {
        content = await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(f); });
      }
      const existing = docs.find((d) => d.name === f.name);
      const doc: Doc = { id: uid(), name: f.name, category: ext === "csv" || ext === "xlsx" ? "Records" : "Evidence", owner, version: existing ? `v${parseInt(existing.version.slice(1)) + 1}` : "v1", uploaded: today(), status: "Pending Review", size: f.size, links: [], content, mime: f.type };
      setState((s) => ({ docs: [doc, ...s.docs.filter((d) => d.name !== f.name)] }));
      toast.success(`Uploaded ${f.name}`, { description: existing ? `New version ${doc.version}` : "Stored in this browser (demo)" });
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  const linkOptions = [...policies.map((p) => p.title), ...suppliers.map((s) => `Supplier: ${s.name}`), "PDPA Assessment"];

  return (
    <Page title="Documents" description="Upload and govern compliance documents. Link them to policies, suppliers and assessments."
      actions={<>
        <input ref={fileRef} type="file" multiple accept=".pdf,.docx,.csv,.xlsx" className="hidden" onChange={(e) => onFiles(e.target.files)} />
        <Button disabled={!canUpload || busy} onClick={() => fileRef.current?.click()}><Upload className="mr-2 h-4 w-4" />{busy ? "Uploading…" : "Upload"}</Button>
      </>}>
      <Card className="shadow-card">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search documents…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" /></div>
            <Select value={cat} onValueChange={setCat}><SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            <Select value={status} onValueChange={setStatus}><SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{["Pending Review", "Reviewed", "Expired"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
          </div>
          {rows.length === 0 ? <Empty title="No documents match">Try clearing filters or upload a file.</Empty> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Owner</TableHead><TableHead>Version</TableHead><TableHead>Uploaded</TableHead><TableHead>Status</TableHead><TableHead>Linked to</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {rows.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium"><div className="flex items-center gap-2">{d.name}{d.demo && <DemoBadge label="Demo" />}</div></TableCell>
                      <TableCell>
                        <Select value={d.category} disabled={!canEdit} onValueChange={(v) => setState((s) => ({ docs: s.docs.map((x) => (x.id === d.id ? { ...x, category: v } : x)) }))}>
                          <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger><SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{d.owner}</TableCell><TableCell>{d.version}</TableCell><TableCell>{fmtDate(d.uploaded)}</TableCell>
                      <TableCell>
                        <button disabled={!canEdit} onClick={() => setState((s) => ({ docs: s.docs.map((x) => (x.id === d.id ? { ...x, status: x.status === "Reviewed" ? "Pending Review" : "Reviewed" } : x)) }))} title="Toggle review status"><Status value={d.status} /></button>
                      </TableCell>
                      <TableCell className="max-w-48 text-xs text-muted-foreground">{d.links.join(", ") || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <Button size="icon" variant="ghost" onClick={() => setPreview(d)} aria-label="Preview"><Eye className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" disabled={!canEdit} onClick={() => { setLinkDoc(d); setLinkTo(""); }} aria-label="Link"><Link2 className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" disabled={!d.content} title={d.content ? "Download" : "No file stored for demo record"} onClick={() => { const a = document.createElement("a"); a.href = d.content!; a.download = d.name; a.click(); }} aria-label="Download"><Download className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" disabled={!canEdit} onClick={() => setDel(d)} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Accepted: PDF, DOCX, CSV, XLSX up to 10 MB. Demo records have metadata only and cannot be downloaded. Files are stored in this browser only.</p>
        </CardContent>
      </Card>

      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{preview?.name}</DialogTitle><DialogDescription>{preview?.category} · {preview?.version} · {((preview?.size ?? 0) / 1024).toFixed(0)} KB · owner {preview?.owner}</DialogDescription></DialogHeader>
          {preview?.content && preview.name.endsWith(".pdf") ? <iframe src={preview.content} className="h-96 w-full rounded border" title="preview" />
            : preview?.content && preview.name.endsWith(".csv") ? <pre className="max-h-96 overflow-auto rounded bg-muted p-3 text-xs">{atob(preview.content.split(",")[1] ?? "").slice(0, 4000)}</pre>
            : <Empty title="Preview not available">{preview?.demo ? "This is a demo record without a stored file." : "Inline preview is supported for PDF and CSV. Download to view."}</Empty>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!linkDoc} onOpenChange={() => setLinkDoc(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Link “{linkDoc?.name}”</DialogTitle><DialogDescription>Connect this document to a policy, supplier or assessment.</DialogDescription></DialogHeader>
          <Select value={linkTo} onValueChange={setLinkTo}><SelectTrigger><SelectValue placeholder="Choose item" /></SelectTrigger><SelectContent>{linkOptions.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
          <DialogFooter><Button disabled={!linkTo} onClick={() => { setState((s) => ({ docs: s.docs.map((x) => (x.id === linkDoc!.id ? { ...x, links: Array.from(new Set([...x.links, linkTo])) } : x)) })); toast.success("Linked"); setLinkDoc(null); }}>Save link</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!del} onOpenChange={() => setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete {del?.name}?</AlertDialogTitle><AlertDialogDescription>This removes the document and all its links. This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { setState((s) => ({ docs: s.docs.filter((x) => x.id !== del!.id) })); toast.success("Document deleted"); }}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
}
