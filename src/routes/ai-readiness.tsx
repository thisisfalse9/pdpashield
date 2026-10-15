import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Download, FileSpreadsheet, Loader2, ScanSearch, ShieldCheck, Upload, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Page, Notice, ScoreRing, Status, Empty, downloadFile, fmtDate } from "@/components/app/kit";
import { pushNotice, setState, uid, useStore } from "@/lib/store";
import { detectPii, maskRows, scoreDataset, SAMPLE_CSV, PII_LABEL, type Finding, type MaskMode, type Row } from "@/lib/pii";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/ai-readiness")({
  head: () => meta("AI Readiness Check", "Scan CSV/XLSX files for PII, mask it and export AI-ready data."),
  component: AiReadiness,
});

type Step = 0 | 1 | 2 | 3 | 4;
const STEPS = ["Upload", "Scan", "Review", "Mask", "Download"];

function AiReadiness() {
  const scans = useStore((s) => s.scans);
  const [file, setFile] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [cols, setCols] = useState<string[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [modes, setModes] = useState<Record<string, MaskMode>>({});
  const [masked, setMasked] = useState<Row[] | null>(null);
  const [step, setStep] = useState<Step>(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  function load(name: string, data: Row[], columns: string[]) {
    if (!columns.length || !data.length) { setError("The dataset is empty — no rows or columns were found."); return; }
    setFile(name); setRows(data); setCols(columns); setFindings([]); setMasked(null); setError(""); setStep(1);
    toast.success(`Loaded ${data.length} rows from ${name}`);
  }

  function parseCsv(name: string, text: string) {
    const r = Papa.parse<Row>(text.trim(), { header: true, skipEmptyLines: true });
    if (r.errors.length && r.errors.some((e) => e.type !== "FieldMismatch")) { setError(`Malformed CSV: ${r.errors[0].message} (row ${r.errors[0].row ?? "?"})`); return; }
    if (r.errors.length) toast.warning(`${r.errors.length} row(s) had an unexpected number of fields`);
    load(name, r.data, r.meta.fields ?? []);
  }

  async function onFile(f?: File) {
    if (!f) return;
    setError("");
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "xlsx") { setError("Unsupported file type. Please upload a .csv or .xlsx file."); return; }
    if (f.size > 5 * 1024 * 1024) { setError("File is larger than 5 MB. Split the dataset and try again."); return; }
    try {
      if (ext === "csv") parseCsv(f.name, await f.text());
      else {
        const wb = XLSX.read(await f.arrayBuffer());
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json<Row>(ws, { defval: "", raw: false });
        load(f.name, data, data.length ? Object.keys(data[0]) : []);
      }
    } catch {
      setError("We couldn't read this file. It may be corrupted or password-protected.");
    }
    if (ref.current) ref.current.value = "";
  }

  function scan() {
    setBusy(true);
    setTimeout(() => {
      const f = detectPii(rows, cols);
      setFindings(f);
      setModes(Object.fromEntries(f.map((x) => [x.column, x.severity === "High" ? "redact" : "partial"])));
      setBusy(false); setStep(2);
      const sc = scoreDataset(rows, cols, f, false);
      setState((s) => ({ scans: [{ id: uid(), at: new Date().toISOString(), file, rows: rows.length, findings: f.reduce((a, b) => a + b.count, 0), ...sc, masked: false }, ...s.scans] }));
      pushNotice(`Scan of ${file}: ${f.length} PII column finding(s)`, "scan");
      toast.success(f.length ? `Found potential PII in ${new Set(f.map((x) => x.column)).size} column(s)` : "No PII patterns detected");
    }, 700);
  }

  function applyMask() {
    const m = maskRows(rows, findings, modes);
    setMasked(m); setStep(4);
    const sc = scoreDataset(m, cols, findings, true);
    setState((s) => ({ scans: [{ id: uid(), at: new Date().toISOString(), file, rows: rows.length, findings: findings.reduce((a, b) => a + b.count, 0), ...sc, masked: true }, ...s.scans] }));
    toast.success("Masking applied and saved to assessment history");
  }

  function exportMasked(kind: "csv" | "xlsx") {
    if (!masked) return;
    const base = file.replace(/\.(csv|xlsx)$/i, "") + "_masked";
    if (kind === "csv") downloadFile(base + ".csv", Papa.unparse(masked));
    else {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(masked), "Masked");
      const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
      downloadFile(base + ".xlsx", buf, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    }
  }

  const before = rows.length ? scoreDataset(rows, cols, findings, false) : null;
  const after = masked ? scoreDataset(masked, cols, findings, true) : null;
  const sc = after ?? before;
  const preview = (masked ?? rows).slice(0, 6);

  return (
    <Page title="AI Readiness Check" description="Upload → Scan → Review findings → Mask → Download. Processing happens entirely in your browser; nothing is sent to an AI service.">
      <div className="flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${step >= i ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            <span className="grid h-5 w-5 place-items-center rounded-full bg-card/20">{i + 1}</span>{s}
          </div>
        ))}
      </div>

      <Card className="shadow-card">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-foreground"><FileSpreadsheet className="h-7 w-7" /></div>
          {file ? <p className="font-medium">{file} · {rows.length} rows · {cols.length} columns</p> : <p className="text-sm text-muted-foreground">Upload a CSV or XLSX file (max 5 MB), or try the synthetic sample client list.</p>}
          <input ref={ref} type="file" accept=".csv,.xlsx" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => ref.current?.click()}><Upload className="mr-2 h-4 w-4" />Upload file</Button>
            <Button variant="outline" onClick={() => parseCsv("sample_clients.csv", SAMPLE_CSV)}>Use sample dataset</Button>
            <Button disabled={!rows.length || busy} onClick={scan}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanSearch className="mr-2 h-4 w-4" />}{busy ? "Scanning…" : "Scan for PII"}</Button>
          </div>
          {error && <p className="rounded-md bg-destructive-soft px-3 py-2 text-sm text-destructive">{error}</p>}
          {before && before.missingCells > 0 && <p className="text-xs text-warning">{before.missingCells} empty cell(s) found — this lowers the Data Quality score.</p>}
        </CardContent>
      </Card>

      {step >= 2 && sc && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[["Privacy Risk", sc.privacyRisk, "lower is better"], ["Data Quality", sc.dataQuality, "completeness"], ["AI Readiness", sc.aiReadiness, "combined"]].map(([l, v, h]) => (
            <Card key={l as string} className="shadow-card"><CardContent className="flex items-center gap-4 p-5">
              <ScoreRing value={l === "Privacy Risk" ? 100 - (v as number) : (v as number)} size={84} />
              <div><p className="font-semibold">{l}</p><p className="font-display text-xl">{v}</p><p className="text-xs text-muted-foreground">{h}</p></div>
            </CardContent></Card>
          ))}
        </div>
      )}

      {step >= 2 && (
        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">Findings & masking</CardTitle>
            <Button disabled={!findings.length} onClick={applyMask}><Wand2 className="mr-2 h-4 w-4" />Apply masking</Button></CardHeader>
          <CardContent>
            {findings.length === 0 ? <Empty title="No PII patterns detected">The detector checks for names, emails, SG phone numbers and NRIC/FIN-like IDs. It may still miss data — review manually.</Empty> : (
              <Table>
                <TableHeader><TableRow><TableHead>Field</TableHead><TableHead>Detected type</TableHead><TableHead>Count</TableHead><TableHead>Severity</TableHead><TableHead>Recommended action</TableHead><TableHead>Masking</TableHead></TableRow></TableHeader>
                <TableBody>{findings.map((f) => (
                  <TableRow key={f.column + f.type}>
                    <TableCell className="font-mono text-xs">{f.column}</TableCell><TableCell>{PII_LABEL[f.type]}</TableCell><TableCell>{f.count}</TableCell><TableCell><Status value={f.severity} /></TableCell>
                    <TableCell className="max-w-xs text-xs text-muted-foreground">{f.action}</TableCell>
                    <TableCell><Select value={modes[f.column]} onValueChange={(v) => { setModes({ ...modes, [f.column]: v as MaskMode }); setStep(3); }}>
                      <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="redact">Redact</SelectItem><SelectItem value="partial">Partial mask</SelectItem><SelectItem value="hash">Pseudonymise</SelectItem><SelectItem value="keep">Keep</SelectItem></SelectContent>
                    </Select></TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            )}
            <p className="mt-3 text-xs text-muted-foreground">Detection is pattern-based and not perfectly accurate. It can miss PII or flag false positives — always review results.</p>
          </CardContent>
        </Card>
      )}

      {rows.length > 0 && (
        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between gap-2"><CardTitle className="text-base">{masked ? "Masked preview" : "Data preview"}</CardTitle>
            {masked && <div className="flex gap-2"><Button variant="outline" onClick={() => exportMasked("csv")}><Download className="mr-2 h-4 w-4" />CSV</Button><Button variant="outline" onClick={() => exportMasked("xlsx")}><Download className="mr-2 h-4 w-4" />XLSX</Button></div>}
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table><TableHeader><TableRow>{cols.map((c) => <TableHead key={c}>{c}</TableHead>)}</TableRow></TableHeader>
              <TableBody>{preview.map((r, i) => <TableRow key={i}>{cols.map((c) => <TableCell key={c} className="whitespace-nowrap font-mono text-xs">{r[c] || <span className="text-warning">∅</span>}</TableCell>)}</TableRow>)}</TableBody></Table>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4" />Assessment history</CardTitle></CardHeader>
        <CardContent className="divide-y p-0">
          {scans.map((x) => (
            <div key={x.id} className="grid grid-cols-2 gap-2 p-4 text-sm sm:grid-cols-6">
              <span className="col-span-2 truncate font-medium">{x.file}</span><span className="text-muted-foreground">{fmtDate(x.at)}</span>
              <span>Risk {x.privacyRisk}</span><span>AI {x.aiReadiness}</span><span><Status value={x.masked ? "Resolved" : "Flagged"} /></span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Notice>Your files never leave this browser. No data is sent to external AI services.</Notice>
    </Page>
  );
}
