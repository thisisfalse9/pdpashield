import { describe, expect, it } from "vitest";
import { changeFromPrevious, upsertReport, type MonthlyReport } from "@/lib/reports";

const r = (month: string, overall: number): MonthlyReport => ({
  month, overall, manual: overall, monitoring: overall, auditing: overall,
  weights: { manual: 50, monitoring: 25, auditing: 25 }, answered: 1, totalControls: 1, openTasks: 0, note: "", savedBy: "Harry", savedAt: "2026-10-01",
});

describe("monthly reports", () => {
  it("saving twice in the same month keeps one record (latest wins)", () => {
    const list = upsertReport(upsertReport([r("2026-09", 60)], r("2026-10", 70)), r("2026-10", 75));
    expect(list.map((x) => x.month)).toEqual(["2026-10", "2026-09"]);
    expect(list[0].overall).toBe(75);
  });
  it("change is measured against the previous saved month", () => {
    const list = [r("2026-08", 50), r("2026-10", 72), r("2026-09", 65)];
    expect(changeFromPrevious(list, "2026-10")).toBe(7);
    expect(changeFromPrevious(list, "2026-08")).toBeNull();
  });
});
