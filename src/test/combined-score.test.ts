import { describe, expect, it } from "vitest";
import { auditingScore, combinedScore, monitoringScore } from "@/lib/scoring";

describe("combined PDPA score", () => {
  it("weights 50/25/25", () => expect(combinedScore({ manual: 80, monitoring: 60, auditing: 40 }, { manual: 50, monitoring: 25, auditing: 25 })).toBe(65));
  it("equal weights is a direct average", () => expect(combinedScore({ manual: 90, monitoring: 60, auditing: 30 }, { manual: 1, monitoring: 1, auditing: 1 })).toBe(60));
  it("monitoring = allowed share", () => expect(monitoringScore([{ status: "Allowed" }, { status: "Flagged" }, { status: "Blocked" }, { status: "Allowed" }])).toBe(50));
  it("auditing excludes rejected", () => expect(auditingScore([{ decision: "Approved" }, { decision: "Rejected" }, { decision: "Auto-logged" }, { decision: "Approved" }])).toBe(75));
});
