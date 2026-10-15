import { describe, expect, it } from "vitest";
import { calcScore, riskScore } from "@/lib/scoring";
import { classifyValue, maskValue } from "@/lib/pii";

describe("PDPA score", () => {
  const controls = [
    { id: "a", obligation: "", question: "", weight: 2 },
    { id: "b", obligation: "", question: "", weight: 1 },
    { id: "c", obligation: "", question: "", weight: 1 },
  ];
  it("Partial counts as half", () => {
    expect(calcScore(controls, { a: "Yes", b: "Partial", c: "No" })).toBe(63);
  });
  it("Not Applicable is excluded from the score", () => {
    expect(calcScore(controls, { a: "Yes", b: "N/A", c: "N/A" })).toBe(100);
  });
});

describe("PII detection", () => {
  it("detects NRIC/FIN-like ids", () => {
    expect(classifyValue("S1234567D")).toBe("nric");
    expect(classifyValue("G7654321M")).toBe("nric");
  });
  it("detects SG phone and email", () => {
    expect(classifyValue("+65 9123 4567")).toBe("phone");
    expect(classifyValue("a@b.sg")).toBe("email");
  });
  it("partial mask keeps last 4 of NRIC", () => {
    expect(maskValue("S1234567D", "nric", "partial")).toBe("*****567D");
  });
});

describe("AI risk", () => {
  it("likelihood x impact >= 15 is High", () => {
    expect(riskScore(3, 5).level).toBe("High");
    expect(riskScore(2, 4).level).toBe("Medium");
  });
});
