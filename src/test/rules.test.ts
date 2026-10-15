import { describe, expect, it } from "vitest";
import { calcScore, riskScore } from "@/lib/scoring";
import { classifyValue, maskValue } from "@/lib/pii";
import {
  alertsFromScan,
  maskHost,
  parseInventory,
  scanSummary,
  scanTable,
} from "@/lib/monitoring";

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

describe("masking other personal data", () => {
  it("partial mask keeps only first character", () => {
    expect(maskValue("Blk 123 Bedok", "other", "partial")).toBe("B********");
  });
});

const PAYROLL = {
  table: "payroll",
  columns: [
    { name: "employee_name", type: "text" },
    { name: "nric", type: "text" },
    { name: "salary_sgd", type: "numeric" },
    { name: "bank_account", type: "text" },
    { name: "pay_month", type: "text" },
  ],
};

const PAYROLL_ROWS = [
  { employee_name: "Ong Bee Lian", nric: "S5566778J", salary_sgd: "4200", bank_account: "012-345678-9", pay_month: "2026-09" },
  { employee_name: "Kumar Sivalingam", nric: "S6677889K", salary_sgd: "3850", bank_account: "023-456789-0", pay_month: "2026-09" },
];

describe("live database monitoring", () => {
  it("names sensitive columns the value patterns cannot see", () => {
    const scan = scanTable(PAYROLL, 6, PAYROLL_ROWS);
    const labels = scan.findings.map((f) => f.label ?? f.type);
    expect(labels).toContain("Bank account");
    expect(labels).toContain("Salary");
    expect(scan.sensitivity).toBe("High");
    expect(scan.rowCount).toBe(6);
  });

  it("masks personal data before it leaves the server", () => {
    const scan = scanTable(PAYROLL, 6, PAYROLL_ROWS);
    expect(scan.maskedSamples[0]!.nric).toBe("[REDACTED]");
    expect(scan.maskedSamples[0]!.bank_account).toBe("[REDACTED]");
    expect(scan.maskedSamples[0]!.salary_sgd).toBe("4***");
    expect(scan.maskedSamples[0]!.pay_month).toBe("2026-09");
  });

  it("raises the highest alert for the NRIC column", () => {
    const alerts = alertsFromScan([scanTable(PAYROLL, 6, PAYROLL_ROWS)]);
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0]!.risk).toBe(85);
    expect(alerts[0]!.title).toContain("payroll");
  });

  it("keeps one finding per column and type", () => {
    const scan = scanTable(PAYROLL, 6, PAYROLL_ROWS);
    const nricFindings = scan.findings.filter((f) => f.column === "nric");
    expect(nricFindings).toHaveLength(1);
    expect(nricFindings[0]!.label).toBe("NRIC / FIN");
    expect(nricFindings[0]!.count).toBe(2);
  });

  it("leaves a table with no personal data quiet", () => {
    const scan = scanTable(
      { table: "firm_settings", columns: [{ name: "key", type: "text" }, { name: "value", type: "text" }] },
      4,
      [{ key: "firm_name", value: "Demo Firm LLP" }],
    );
    expect(scan.findings).toHaveLength(0);
    expect(scan.sensitivity).toBe("Low");
    expect(alertsFromScan([scan])).toHaveLength(0);
  });

  it("ignores malformed inventory entries and unsafe table names", () => {
    const tables = parseInventory({
      tables: [
        { table: "clients", columns: [{ name: "email", type: "text" }, null] },
        { table: "bad;name", columns: [] },
        null,
        { table: 42 },
      ],
    });
    expect(tables.map((t) => t.table)).toEqual(["clients"]);
    expect(tables[0]!.columns).toEqual([{ name: "email", type: "text" }]);
    expect(parseInventory({ tables: "nope" })).toEqual([]);
  });

  it("summarises a scan for the audit trail", () => {
    const scans = [scanTable(PAYROLL, 6, PAYROLL_ROWS)];
    expect(scanSummary(scans)).toBe("1 tables, 6 rows, 3 personal-data columns (2 high risk)");
  });

  it("hides most of the project reference when showing the target", () => {
    expect(maskHost("https://abcdef123456.supabase.co")).toBe("https://abc…456.supabase.co");
    expect(maskHost("not a url")).toBe("unknown host");
  });
});
