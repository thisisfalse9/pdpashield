// Server-only: calls Lovable AI (Responses API, streamed) to classify dataset columns.
import { z } from "zod";

const schema = z.object({
  columns: z.array(
    z.object({
      column: z.string(),
      piiType: z.string(),
      severity: z.enum(["High", "Medium", "Low", "None"]),
      confidence: z.number(),
      reason: z.string(),
      recommendation: z.string(),
    }),
  ),
  summary: z.string(),
});
export type AiReview = z.infer<typeof schema>;

const jsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["columns", "summary"],
  properties: {
    summary: { type: "string" },
    columns: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["column", "piiType", "severity", "confidence", "reason", "recommendation"],
        properties: {
          column: { type: "string" },
          piiType: { type: "string" },
          severity: { type: "string", enum: ["High", "Medium", "Low", "None"] },
          confidence: { type: "number" },
          reason: { type: "string" },
          recommendation: { type: "string" },
        },
      },
    },
  },
};

const INSTRUCTIONS =
  "You are a Singapore PDPA data-protection analyst reviewing a tabular dataset from an accounting firm before it is used for analytics or AI. " +
  "For EVERY column, classify the kind of personal data it holds (e.g. person name, email, phone, NRIC/FIN, passport, date of birth, home address, postal code, bank account, salary/income, health, religion/race, IP address, free-text with possible PII, company info, financial amount, none). " +
  "Severity: High for NRIC/FIN/passport, bank/financial account, health, salary, or data enabling identity theft; Medium for direct contact identifiers (email, phone, address, DOB); Low for names or quasi-identifiers; None for non-personal columns. " +
  "Confidence is 0-1. Reason must cite what you saw in the samples without repeating full sensitive values. Recommendation: one short, practical action referencing PDPA/PDPC guidance where relevant. Summary: 2 sentences on overall AI readiness. Be honest about uncertainty.";

export async function runAiPiiReview(input: { columns: { name: string; samples: string[] }[] }): Promise<AiReview> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this workspace.");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      instructions: INSTRUCTIONS,
      input: [{ role: "user", content: JSON.stringify(input) }],
      reasoning: { effort: "low" },
      store: false,
      stream: true,
      text: { format: { type: "json_schema", name: "pii_review", strict: true, schema: jsonSchema } },
    }),
  });

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    let message = "";
    try { message = JSON.parse(body)?.error?.message ?? JSON.parse(body)?.message ?? ""; } catch { /* not json */ }
    if (res.status === 402) throw new Error(message || "AI credits have run out for this workspace. Add credits in Settings → Plans & credits.");
    if (res.status === 429) throw new Error("The AI service is busy. Please wait a moment and try again.");
    if (res.status === 403) throw new Error(message || "AI access is not available for this workspace.");
    throw new Error(`AI review failed (${res.status}). ${message}`.trim());
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let text = "";
  let failure = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n\n")) !== -1) {
      const frame = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const data = frame.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("");
      if (!data || data === "[DONE]") continue;
      try {
        const ev = JSON.parse(data);
        if (ev.type === "response.output_text.delta") text += ev.delta;
        else if (ev.type === "response.refusal.delta") failure = "The AI declined to review this dataset.";
        else if (ev.type === "response.failed" || ev.type === "error") failure = ev.response?.error?.message ?? ev.message ?? "AI review failed.";
      } catch { /* partial/unknown frame */ }
    }
  }
  if (failure) throw new Error(failure);
  try {
    return schema.parse(JSON.parse(text));
  } catch {
    throw new Error("The AI returned an unexpected answer. Please try again.");
  }
}
