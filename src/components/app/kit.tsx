import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Info, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function Page({ title, description, actions, children }: { title: string; description?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold">{title}</h2>
          {description && <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function DemoBadge({ label = "Demo Data" }: { label?: string }) {
  return <Badge variant="demo">{label}</Badge>;
}

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warning" }) {
  return (
    <div className={cn("flex gap-2 rounded-lg border px-3 py-2.5 text-sm", tone === "info" ? "border-info/20 bg-info-soft text-foreground" : "border-warning/30 bg-warning-soft text-foreground")}>
      <Info className={cn("mt-0.5 h-4 w-4 shrink-0", tone === "info" ? "text-info" : "text-warning")} />
      <div>{children}</div>
    </div>
  );
}

export function Stat({ label, value, hint, icon, tone }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; tone?: "brand" | "warning" | "danger" | "success" }) {
  const toneCls = { brand: "bg-accent text-accent-foreground", warning: "bg-warning-soft text-warning", danger: "bg-destructive-soft text-destructive", success: "bg-success-soft text-success" }[tone ?? "brand"];
  return (
    <Card className="shadow-card">
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {icon && <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg", toneCls)}>{icon}</div>}
      </CardContent>
    </Card>
  );
}

const TONE: Record<string, "success" | "warning" | "danger" | "info" | "muted"> = {
  Published: "success", Approved: "success", Reviewed: "success", Signed: "success", Completed: "success", Implemented: "success", Paid: "success", Active: "success", Allowed: "success", Configured: "success", Connected: "success", Low: "success", Resolved: "success",
  "Pending Approval": "warning", "Pending Review": "warning", Pending: "warning", "In Progress": "warning", Partial: "warning", "Under Review": "warning", "In Review": "warning", Medium: "warning", Invited: "warning", Flagged: "warning", Open: "warning", Due: "warning",
  Expired: "danger", None: "danger", High: "danger", Blocked: "danger", Overdue: "danger", "Not Verified": "danger", Failed: "danger",
  Draft: "muted", Planned: "info", "Not Started": "muted", "N/A": "muted", "Not Connected": "muted", Archived: "muted", Processing: "info",
};
export function Status({ value }: { value: string }) {
  return <Badge variant={TONE[value] ?? "muted"}>{value}</Badge>;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center">
      <Inbox className="h-8 w-8 text-muted-foreground" />
      <p className="font-medium">{title}</p>
      {children && <div className="text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function ScoreRing({ value, size = 120, label }: { value: number; size?: number; label?: string }) {
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={10} className="fill-none stroke-muted" />
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={10} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)}
          className={cn("fill-none transition-all duration-700", value >= 75 ? "stroke-success" : value >= 50 ? "stroke-brand" : "stroke-warning")} />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-2xl font-semibold">{value}</div>
        {label && <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>}
      </div>
    </div>
  );
}

export function downloadFile(name: string, content: BlobPart, mime = "text/csv") {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]!);
  const esc = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

export function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-SG", { day: "2-digit", month: "short", year: "numeric" });
}
