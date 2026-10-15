import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, FileText, RotateCcw, ScanSearch, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Page, DemoBadge, Notice, ScoreRing, Stat, downloadFile } from "@/components/app/kit";
import {
  countDocPii, detectDocPii, docReadiness, maskDoc, DEMO_DOCUMENT, DOC_PII_LABEL,
  type DocMaskMode, type DocMatch, type DocPii,
} from "@/lib/docscan";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/document-scan")({
  head: () => meta("Document Scan", "Scan documents for names, emails, phone numbers and NRIC/FIN, count repeats and mask them."),
  component: DocumentScan,
});

const ALL: DocPii[] = ["name", "email", "phone", "nric"];

function Highlighted({ text, matches }: { text: string; matches: DocMatch[] }) {
  const parts: React.ReactNode[] = [];
  let i = 0;
  matches.forEach((m, k) => {
    parts.push(text.slice(i, m.start));
    parts.push(<mark key={k} className="rounded bg-accent px-0.5 font-semibold text-accent-foreground" title={DOC_PII_LABEL[m.type]}>{m.value}</mark>);
    i = m.end;
  });
  parts.push(text.slice(i));
  return <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">{parts}</pre>;
}

function DocumentScan() {
  const [text, setText] = useState(DEMO_DOCUMENT);
  const [scanned, setScanned] = useState<string | null>(null);
  const [mode, setMode] = useState<DocMaskMode>("label");
  const [types, setTypes] = useState<DocPii[]>(ALL);
  const [masked, setMasked] = useState<string | null>(null);

  const matches = useMemo(() => (scanned ? detectDocPii(scanned) : []), [scanned]);
  const counts = useMemo(() => countDocPii(matches), [matches]);
  const before = docReadiness(matches);
  const after = masked !== null ? docReadiness(detectDocPii(masked)) : null;

  const onFile = async (f: File) => { setText(await f.text()); setScanned(null); setMasked(null); };

  return (
    <Page
      title="Document Scan"
      description="Detect names, emails, phone numbers and NRIC/FIN in a document, see how often each repeats, then mask them."
      actions={<DemoBadge label="Demo Document" />}
    >
      <Notice>Detection runs in your browser using pattern rules — it can miss or over-flag items, so always review before sharing. Scores are internal estimates.</Notice>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Document</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => { setText(DEMO_DOCUMENT); setScanned(null); setMasked(null); }}>
              <RotateCcw className="mr-2 h-4 w-4" /> Load demo document
            </Button>
            <Button variant="outline" size="sm" asChild>
              <label className="cursor-pointer">Upload .txt
                <input type="file" accept=".txt,.md,.csv" className="hidden" onChange={(e) => e.target.files?.[0] && void onFile(e.target.files[0])} />
              </label>
            </Button>
            <Button size="sm" onClick={() => { setScanned(text); setMasked(null); }}>
              <ScanSearch className="mr-2 h-4 w-4" /> Scan document
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            className="w-full rounded-md border-2 border-input bg-background p-3 font-mono text-sm"
          />
        </CardContent>
      </Card>

      {scanned !== null && (
        <>
          <div className="grid gap-4 md:grid-cols-[auto_1fr]">
            <Card>
              <CardContent className="flex flex-col items-center gap-2 p-6">
                <ScoreRing value={after ?? before} label="AI Readiness" />
                <p className="text-xs text-muted-foreground">{after !== null ? `After masking (was ${before})` : "Before masking"}</p>
              </CardContent>
            </Card>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {counts.map((c) => (
                <Stat key={c.type} label={DOC_PII_LABEL[c.type]} value={c.total} hint={`${c.unique} unique`} tone={c.total ? "warning" : "success"} />
              ))}
            </div>
          </div>

          <Card>
            <CardHeader><CardTitle>Repeated PII to mask</CardTitle></CardHeader>
            <CardContent>
              {matches.length === 0 ? <p className="text-sm text-muted-foreground">No personal data found.</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Value</TableHead><TableHead className="text-right">Times found</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {counts.flatMap((c) => c.values.map((v) => (
                      <TableRow key={c.type + v.value}>
                        <TableCell>{DOC_PII_LABEL[c.type]}</TableCell>
                        <TableCell className="font-mono">{v.value}</TableCell>
                        <TableCell className="text-right font-bold">{v.count}×</TableCell>
                      </TableRow>
                    )))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Highlighted document</CardTitle></CardHeader>
            <CardContent><Highlighted text={scanned} matches={matches} /></CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
              <CardTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5" /> PII masking</CardTitle>
              <div className="flex flex-wrap items-center gap-3">
                {ALL.map((t) => (
                  <label key={t} className="flex items-center gap-1.5 text-sm">
                    <Checkbox checked={types.includes(t)} onCheckedChange={(v) => setTypes(v ? [...types, t] : types.filter((x) => x !== t))} />
                    {DOC_PII_LABEL[t]}
                  </label>
                ))}
                <Select value={mode} onValueChange={(v) => setMode(v as DocMaskMode)}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="label">Replace with label</SelectItem>
                    <SelectItem value="partial">Partial mask</SelectItem>
                    <SelectItem value="redact">Full redact</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={() => setMasked(maskDoc(scanned, matches, mode, types))}>Mask PII</Button>
              </div>
            </CardHeader>
            {masked !== null && (
              <CardContent className="space-y-3">
                <pre className="whitespace-pre-wrap break-words rounded-md border-2 border-input bg-muted p-3 font-sans text-sm">{masked}</pre>
                <Button variant="outline" size="sm" onClick={() => downloadFile("masked-document.txt", masked, "text/plain")}>
                  <Download className="mr-2 h-4 w-4" /> Download masked document
                </Button>
              </CardContent>
            )}
          </Card>
        </>
      )}
    </Page>
  );
}
