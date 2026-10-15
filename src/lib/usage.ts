import { PLANS } from "./seed";
import type { State } from "./store";

export function usage(s: Pick<State, "plan" | "scans" | "docs" | "members">) {
  const p = PLANS[s.plan];
  const storageGb = +(s.docs.reduce((a, d) => a + d.size, 0) / 1e9 + 3.2).toFixed(2); // +3.2 GB demo baseline
  return [
    { key: "scans", label: "Monthly PII scans", used: s.scans.length + 140, limit: p.scans, unit: "" },
    { key: "storage", label: "Document storage", used: storageGb, limit: p.storageGb, unit: " GB" },
    { key: "seats", label: "Team seats", used: s.members.length, limit: p.seats, unit: "" },
    { key: "dbs", label: "Database connections", used: 0, limit: p.dbs, unit: "" },
  ];
}
