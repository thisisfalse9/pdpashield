import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Page, Status, fmtDate } from "@/components/app/kit";
import { useStore } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/sources/documents")({
  head: () => meta("Document Sources", "Where documents come from and their processing status."),
  component: DocSources,
});

function DocSources() {
  const docs = useStore((s) => s.docs);
  const scans = useStore((s) => s.scans);
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [sel, setSel] = useState<string | null>(null);
  const rows = docs.map((d) => {
    const scanned = scans.find((s) => s.file === d.name);
    return { ...d, source: d.demo ? "Demo seed" : "Manual upload", processing: scanned ? "Completed" : /\.(csv|xlsx)$/.test(d.name) ? "Pending" : "Not Started", scanned };
  }).filter((d) => d.name.toLowerCase().includes(q.toLowerCase()) && (type === "all" || d.source === type));
  const s = rows.find((r) => r.id === sel);
  return (
    <Page title="Document Sources" description={"Source and processing status of documents. Manage the documents themselves in Overview → Documents."}>
      <Card className="shadow-card"><CardContent className="space-y-3 p-4">
        <div className="flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <Select value={type} onValueChange={setType}><SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All sources</SelectItem><SelectItem value="Manual upload">Manual upload</SelectItem><SelectItem value="Demo seed">Demo seed</SelectItem></SelectContent></Select></div>
        <Table><TableHeader><TableRow><TableHead>Document</TableHead><TableHead>Source type</TableHead><TableHead>Uploaded</TableHead><TableHead>Processing</TableHead><TableHead>Linked to</TableHead></TableRow></TableHeader>
          <TableBody>{rows.map((r) => <TableRow key={r.id} className="cursor-pointer" onClick={() => setSel(r.id)}><TableCell className="font-medium">{r.name}</TableCell><TableCell>{r.source}</TableCell><TableCell>{fmtDate(r.uploaded)}</TableCell><TableCell><Status value={r.processing} /></TableCell><TableCell className="text-xs text-muted-foreground">{r.links.join(", ") || "—"}</TableCell></TableRow>)}</TableBody></Table>
        <p className="text-xs text-muted-foreground">Cloud storage sources (Google Drive, SharePoint) are planned — see Settings → Integrations.</p>
      </CardContent></Card>
      <Sheet open={!!s} onOpenChange={() => setSel(null)}>
        <SheetContent>{s && <><SheetHeader><SheetTitle>{s.name}</SheetTitle><SheetDescription>Processing details</SheetDescription></SheetHeader>
          <dl className="mt-6 space-y-3 px-4 text-sm">
            <div><dt className="text-muted-foreground">Source</dt><dd>{s.source}</dd></div>
            <div><dt className="text-muted-foreground">Size</dt><dd>{(s.size / 1024).toFixed(0)} KB</dd></div>
            <div><dt className="text-muted-foreground">PII scan</dt><dd>{s.scanned ? `${s.scanned.findings} findings, AI readiness ${s.scanned.aiReadiness}` : "Not scanned"}</dd></div>
            <div><dt className="text-muted-foreground">Linked</dt><dd>{s.links.join(", ") || "—"}</dd></div>
            <Link to="/ai-readiness" className="block text-info hover:underline">Run AI Readiness Check →</Link>
          </dl></>}</SheetContent>
      </Sheet>
    </Page>
  );
}
