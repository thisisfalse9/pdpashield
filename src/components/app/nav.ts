import {
  LayoutDashboard, FileText, ScrollText, Gauge, ScanSearch, Activity, ClipboardList,
  ShieldCheck, ListChecks, Truck, History, AlertTriangle, LineChart, Database, FolderOpen,
  CreditCard, Package, BarChart3, Users, Receipt, User, KeyRound, Bell, Lock, Plug, Building2,
  type LucideIcon,
} from "lucide-react";

export interface NavItem { title: string; url: string; icon: LucideIcon }
export interface NavGroup { label: string; items: NavItem[] }

export const NAV: NavGroup[] = [
  { label: "Overview", items: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Documents", url: "/documents", icon: FileText },
    { title: "Policies", url: "/policies", icon: ScrollText },
    { title: "PDPA Score", url: "/pdpa-score", icon: Gauge },
  ] },
  { label: "Compliance", items: [
    { title: "AI Readiness Check", url: "/ai-readiness", icon: ScanSearch },
    { title: "Database Monitoring", url: "/database-monitoring", icon: Activity },
    { title: "Data Auditing", url: "/data-auditing", icon: ClipboardList },
  ] },
  { label: "Trust", items: [
    { title: "Trust Center", url: "/trust-center", icon: ShieldCheck },
    { title: "Security Questionnaire", url: "/security-questionnaire", icon: ListChecks },
    { title: "Suppliers", url: "/suppliers", icon: Truck },
  ] },
  { label: "Responsible AI", items: [
    { title: "AI Model Audit Trail", url: "/ai-audit-trail", icon: History },
    { title: "AI Risk Assessment", url: "/ai-risk-assessment", icon: AlertTriangle },
    { title: "Model Monitoring", url: "/model-monitoring", icon: LineChart },
  ] },
  { label: "Sources", items: [
    { title: "Database", url: "/sources/database", icon: Database },
    { title: "Documents", url: "/sources/documents", icon: FolderOpen },
  ] },
  { label: "Subscription", items: [
    { title: "Subscription Overview", url: "/subscription", icon: CreditCard },
    { title: "Plans & Billing", url: "/subscription/plans", icon: Package },
    { title: "Usage & Limits", url: "/subscription/usage", icon: BarChart3 },
    { title: "Team & Seats", url: "/subscription/seats", icon: Users },
    { title: "Invoices & Payments", url: "/subscription/invoices", icon: Receipt },
  ] },
  { label: "Settings", items: [
    { title: "Profile & Account", url: "/settings/profile", icon: User },
    { title: "Team & Permissions", url: "/settings/team", icon: KeyRound },
    { title: "Notifications", url: "/settings/notifications", icon: Bell },
    { title: "Security & Privacy", url: "/settings/security", icon: Lock },
    { title: "Integrations", url: "/settings/integrations", icon: Plug },
    { title: "Organisation Settings", url: "/settings/organisation", icon: Building2 },
  ] },
];

export function findNav(path: string) {
  for (const g of NAV) for (const i of g.items) if (i.url === path) return { group: g.label, item: i };
  return null;
}
