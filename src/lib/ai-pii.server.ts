import { createOpenAI } from "@ai-sdk/openai";
import { Output, streamText, NoObjectGeneratedError } from "ai";
import { z } from "zod";

const RUN_ID = "X-Lovable-AIG-Run-ID";

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

export async function runAiPiiReview(input: { columns: { name: string; samples: string[] }[] }): Promise<AiReview> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this workspace.");
  let runId: string | undefined;
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (url, init) => {
      const headers = new Headers(init?.headers);
      if (runId) headers.set(RUN_ID, runId);
      const res = await fetch(url, { ...init, headers });
      runId ??= res.headers.get(RUN_ID) ?? undefined;
      return res;
    },
  });

  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    maxRetries: 0,
    output: Output.object({ schema }),
    messages: [
      {
        role: "system",
        content:
          "You are a Singapore PDPA data-protection analyst reviewing a tabular dataset from an accounting firm before it is used for analytics or AI. " +
          "For EVERY column, classify the kind of personal data it holds (e.g. person name, email, phone, NRIC/FIN, passport, date of birth, home address, postal code, bank account, salary/income, health, religion/race, IP address, free-text with possible PII, company info, financial amount, none). " +
          "Severity: High for NRIC/FIN/passport, bank/financial account, health, salary, or data that enables identity theft; Medium for direct contact identifiers (email, phone, address, DOB); Low for names or quasi-identifiers; None for non-personal columns. " +
          "Confidence is 0-1. Reason must cite what you saw in the samples (do not repeat full sensitive values). Recommendation must be one short, practical action referencing PDPA/PDPC guidance where relevant. Summary: 2 sentences on overall AI readiness. Be honest about uncertainty.",
      },
      { role: "user", content: JSON.stringify(input) },
    ],
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  try {
    return await result.output;
  } catch (e) {
    if (NoObjectGeneratedError.isInstance(e) && e.text) {
      try {
        return schema.parse(JSON.parse(e.text));
      } catch {
        /* fall through */
      }
    }
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[ai-pii]", msg);
    if (/\b402\b|insufficient credit/i.test(msg)) throw new Error("AI credits have run out for this workspace. Add credits in Settings → Plans & credits.");
    if (/429|rate limit/i.test(msg)) throw new Error("The AI service is busy. Please wait a moment and try again.");
    throw new Error("AI review failed: " + msg.slice(0, 200));
  }
}
