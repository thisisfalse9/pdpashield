import { describe, expect, it } from "vitest";
import { countDocPii, detectDocPii, docReadiness, maskDoc, DEMO_DOCUMENT } from "@/lib/docscan";

describe("document scan", () => {
  it("detects name, email, phone and NRIC/FIN", () => {
    const m = detectDocPii("Name: Tan Wei Ming, S1234567D, a@b.sg, +65 9123 4567, FIN G7654321K");
    expect(m.map((x) => x.type)).toEqual(["name", "nric", "email", "phone", "nric"]);
  });
  it("counts repeats", () => {
    const c = countDocPii(detectDocPii(DEMO_DOCUMENT));
    const name = c.find((x) => x.type === "name")!;
    expect(name.values.find((v) => v.value === "Tan Wei Ming")!.count).toBe(3);
  });
  it("masking removes all PII and scores 100", () => {
    const masked = maskDoc(DEMO_DOCUMENT, detectDocPii(DEMO_DOCUMENT), "label");
    expect(docReadiness(detectDocPii(masked))).toBe(100);
    expect(docReadiness(detectDocPii(DEMO_DOCUMENT))).toBeLessThan(50);
  });
});
