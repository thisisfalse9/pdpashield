// Free-text document PII detection, masking and AI-readiness scoring.
export type DocPii = "name" | "email" | "phone" | "nric";
export type DocMaskMode = "redact" | "partial" | "label";

export interface DocMatch { type: DocPii; value: string; start: number; end: number }

export const DOC_PII_LABEL: Record<DocPii, string> = { name: "Name", email: "Email", phone: "Phone number", nric: "NRIC/FIN" };
const WEIGHT: Record<DocPii, number> = { nric: 12, email: 6, phone: 6, name: 4 };

const PATTERNS: [DocPii, RegExp][] = [
  ["email", /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g],
  ["nric", /\b[STFGM]\d{7}[A-Z]\b/g],
  ["phone", /(?:\+65[\s-]?)?\b[3689]\d{3}[\s-]?\d{4}\b/g],
  // Titles (Mr/Ms/Mrs/Dr/Mdm) or "Name:" labels followed by capitalised words.
  ["name", /(?:\b(?:Mr|Ms|Mrs|Mdm|Dr)\.?\s+|\bName:\s*)([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})/g],
];

export function detectDocPii(text: string): DocMatch[] {
  const out: DocMatch[] = [];
  for (const [type, re] of PATTERNS) {
    for (const m of text.matchAll(re)) {
      const value = type === "name" ? m[1] : m[0];
      const start = (m.index ?? 0) + m[0].length - value.length;
      out.push({ type, value, start, end: start + value.length });
    }
  }
  out.sort((a, b) => a.start - b.start);
  // drop overlaps (first match wins)
  const res: DocMatch[] = [];
  for (const m of out) if (!res.length || m.start >= res[res.length - 1].end) res.push(m);
  return res;
}

export interface DocCount { type: DocPii; total: number; unique: number; values: { value: string; count: number }[] }

export function countDocPii(matches: DocMatch[]): DocCount[] {
  return (Object.keys(DOC_PII_LABEL) as DocPii[]).map((type) => {
    const map = new Map<string, number>();
    for (const m of matches) if (m.type === type) map.set(m.value, (map.get(m.value) ?? 0) + 1);
    const values = [...map].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
    return { type, total: values.reduce((s, v) => s + v.count, 0), unique: values.length, values };
  });
}

/** 100 = no unmasked PII. Each occurrence deducts its weight; floor 0. Internal estimate. */
export function docReadiness(matches: DocMatch[]): number {
  const penalty = matches.reduce((s, m) => s + WEIGHT[m.type], 0);
  return Math.max(0, 100 - penalty);
}

export function maskDocValue(v: string, type: DocPii, mode: DocMaskMode): string {
  if (mode === "label") return `[${DOC_PII_LABEL[type].toUpperCase()}]`;
  if (mode === "redact") return "█".repeat(Math.min(v.length, 10));
  if (type === "email") { const [u, d] = v.split("@"); return `${u[0]}***@${d}`; }
  if (type === "nric") return `${v[0]}****${v.slice(-4)}`;
  if (type === "phone") return `****${v.replace(/\D/g, "").slice(-4)}`;
  return v.split(/\s+/).map((w) => w[0] + ".").join(" ");
}

export function maskDoc(text: string, matches: DocMatch[], mode: DocMaskMode, types: DocPii[] = Object.keys(DOC_PII_LABEL) as DocPii[]): string {
  let out = "", i = 0;
  for (const m of matches) {
    if (!types.includes(m.type)) continue;
    out += text.slice(i, m.start) + maskDocValue(m.value, m.type, mode);
    i = m.end;
  }
  return out + text.slice(i);
}

export const DEMO_DOCUMENT = `ENGAGEMENT LETTER — DEMO DATA (fictional)

Client: Lion City Traders Pte Ltd
Name: Tan Wei Ming
NRIC: S1234567D
Email: weiming.tan@example.sg
Phone: +65 9123 4567

Dear Mr Tan Wei Ming,

Thank you for appointing us for the FY2025 annual audit. Your primary contact will be Ms Priya Nair (priya.nair@example.sg, 8234 5678).
For payroll queries, please contact Mdm Lim Siew Hoon at 6345 6789 or lim.sh@example.sg.

Our records also list director Mr Ahmad Bin Hassan (FIN G7654321K) and Mr Tan Wei Ming as authorised signatories.
Please send the signed copy to weiming.tan@example.sg's assistant, Ms Priya Nair, by 30 November.

Regards,
Dr Chen Jia Hui
Engagement Partner — 9876 5432 | jiahui.chen@example.sg`;
