import { useSyncExternalStore } from "react";
import type { Answer, Control } from "./scoring";

// Browser-local demo persistence. Everything here is synthetic demo data stored in
// this browser only; it is not a server database and enforces nothing server-side.

export type Role = "Admin" | "DPO" | "Compliance Officer" | "Business User";
export type PolicyStatus = "Draft" | "Pending Approval" | "Approved" | "Published";

export interface Doc {
  id: string; name: string; category: string; owner: string; version: string;
  uploaded: string; status: "Pending Review" | "Reviewed" | "Expired"; size: number;
  links: string[]; demo?: boolean; content?: string; mime?: string;
}
export interface Policy {
  id: string; title: string; owner: string; roles: string[]; status: PolicyStatus;
  effective: string; version: number; body: string; controls: string[];
  comments: { by: string; text: string; at: string }[];
  history: { version: number; at: string; note: string }[]; demo?: boolean;
}
export interface Assessment { id: string; at: string; score: number; by: string }
export interface Task { id: string; title: string; owner: string; due: string; done: boolean; control?: string }
export interface Scan {
  id: string; at: string; file: string; rows: number; findings: number;
  privacyRisk: number; dataQuality: number; aiReadiness: number; masked: boolean;
}
export interface Supplier {
  id: string; name: string; service: string; contact: string; data: string; location: string;
  dpa: "Signed" | "Pending" | "None"; review: "Completed" | "In Progress" | "Not Started";
  risk: "Low" | "Medium" | "High"; nextReview: string; archived: boolean; demo?: boolean;
}
export interface QItem { id: string; section: string; q: string; resp: "" | "Implemented" | "Partial" | "Planned" | "N/A"; evidence: string; notes: string; owner: string; reviewDate: string }
export interface AiRisk {
  id: string; model: string; at: string; status: "Draft" | "In Review" | "Approved";
  answers: Record<string, number>; likelihood: number; impact: number;
  mitigations: { text: string; owner: string; due: string }[];
}
export interface Member { id: string; name: string; email: string; role: Role; status: "Active" | "Invited" }
export interface Notice { id: string; at: string; title: string; read: boolean; kind: "deadline" | "scan" | "risk" | "policy" }

export interface State {
  role: Role;
  profile: { name: string; email: string; lang: string; dateFormat: string };
  org: { name: string; uen: string; industry: string; size: string; timezone: string; currency: string; retentionMonths: number };
  docs: Doc[];
  policies: Policy[];
  controls: Control[];
  answers: Record<string, Answer>;
  evidence: Record<string, string>;
  reviewerNotes: Record<string, string>;
  assessments: Assessment[];
  nextAssessment: string;
  tasks: Task[];
  scans: Scan[];
  suppliers: Supplier[];
  questionnaire: QItem[];
  aiRisks: AiRisk[];
  plan: "trial" | "starter" | "professional" | "enterprise";
  billing: "monthly" | "annual";
  members: Member[];
  notifyPrefs: Record<string, { inApp: boolean; email: boolean }>;
  notices: Notice[];
  sessionTimeout: number;
  monthlyReports: import("./reports").MonthlyReport[];
}

import { seed } from "./seed";

const KEY = "pdpa-shield-demo-v2"; // v2: profile name updated from "Harry Tan" to "Harry"
let state: State = seed();
const listeners = new Set<() => void>();
let hydrated = false;

export function hydrateStore() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      state = { ...state, ...JSON.parse(raw) };
      listeners.forEach((l) => l());
    }
  } catch {
    /* ignore corrupt storage */
  }
}

export function setState(fn: (s: State) => Partial<State>) {
  state = { ...state, ...fn(state) };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
  listeners.forEach((l) => l());
}

export function resetDemo() {
  state = seed();
  localStorage.removeItem(KEY);
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const serverState = seed();

export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => sel(state), () => sel(serverState));
}

export const uid = () => Math.random().toString(36).slice(2, 10);
export const today = () => new Date().toISOString().slice(0, 10);

// Role permissions (demo — UI-level only until a backend enforces them).
export type Perm = "view" | "upload" | "edit" | "approve" | "export" | "manageUsers";
export const PERMISSIONS: Record<Role, Perm[]> = {
  Admin: ["view", "upload", "edit", "approve", "export", "manageUsers"],
  DPO: ["view", "upload", "edit", "approve", "export"],
  "Compliance Officer": ["view", "upload", "edit", "export"],
  "Business User": ["view", "upload"],
};
export function useCan(p: Perm) {
  const role = useStore((s) => s.role);
  return PERMISSIONS[role].includes(p);
}

export function pushNotice(title: string, kind: Notice["kind"]) {
  setState((s) => ({ notices: [{ id: uid(), at: new Date().toISOString(), title, read: false, kind }, ...s.notices].slice(0, 30) }));
}
