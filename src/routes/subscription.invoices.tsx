import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Page, DemoBadge, Notice, Status, fmtDate } from "@/components/app/kit";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/subscription/invoices")({
  head: () => meta("Invoices & Payments", "Billing history and payment method status."),
  component: Inv,
});

const INV = [
  { no: "DEMO-2026-010", date: "2026-10-01", amount: 53.41, status: "Paid" },
  { no: "DEMO-2026-009", date: "2026-09-01", amount: 53.41, status: "Paid" },
  { no: "DEMO-2026-008", date: "2026-08-01", amount: 53.41, status: "Paid" },
  { no: "DEMO-2026-007", date: "2026-07-01", amount: 53.41, status: "Failed" },
];

function Inv() {
  const [sel, setSel] = useState<(typeof INV)[number] | null>(null);
  return (
    <Page title="Invoices & Payments" description="Billing history. Payments will be handled by a secure payment provider." actions={<DemoBadge />}>
      <Notice tone="warning">These are sample invoices (<b>Demo Data</b>). No invoice files exist, so downloads are unavailable. Card details are never collected or stored here.</Notice>
      <Card className="shadow-card"><CardHeader><CardTitle className="text-base">Payment method</CardTitle></CardHeader><CardContent className="flex items-center gap-3 text-sm">
        <div className="grid h-10 w-14 place-items-center rounded-md border"><CreditCard className="h-5 w-5 text-muted-foreground" /></div>
        <div className="flex-1"><p className="font-medium">No payment method on file</p><p className="text-xs text-muted-foreground">A payment provider has not been connected yet.</p></div>
        <Status value="Not Connected" />
      </CardContent></Card>
      <Card className="shadow-card"><CardContent className="p-0">
        <Table><TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Billing date</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>{INV.map((i) => <TableRow key={i.no}><TableCell className="font-mono text-xs">{i.no}</TableCell><TableCell>{fmtDate(i.date)}</TableCell><TableCell>S${i.amount.toFixed(2)}</TableCell><TableCell><Status value={i.status} /></TableCell>
            <TableCell className="text-right"><Button size="sm" variant="ghost" onClick={() => setSel(i)}>Details</Button><Button size="sm" variant="ghost" disabled title="No invoice file available">Download</Button></TableCell></TableRow>)}</TableBody></Table>
      </CardContent></Card>
      <Dialog open={!!sel} onOpenChange={() => setSel(null)}>
        <DialogContent><DialogHeader><DialogTitle>{sel?.no}</DialogTitle><DialogDescription>Sample invoice — Demo Data</DialogDescription></DialogHeader>
          {sel && <div className="space-y-2 text-sm"><div className="flex justify-between"><span>Starter plan (monthly)</span><span>S$49.00</span></div><div className="flex justify-between"><span>GST 9%</span><span>S$4.41</span></div><div className="flex justify-between border-t pt-2 font-semibold"><span>Total</span><span>S${sel.amount.toFixed(2)}</span></div><p className="text-muted-foreground">Billed {fmtDate(sel.date)} · <Status value={sel.status} /></p></div>}
        </DialogContent>
      </Dialog>
    </Page>
  );
}
