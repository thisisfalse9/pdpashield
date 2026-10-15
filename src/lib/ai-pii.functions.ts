import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  consent: z.literal(true),
  columns: z
    .array(z.object({ name: z.string().max(200), samples: z.array(z.string().max(300)).max(15) }))
    .min(1)
    .max(80),
});

export const aiPiiReview = createServerFn({ method: "POST" })
  .validator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    console.log("[ai-pii] handler start", data.columns.length, !!process.env["LOVABLE_API_KEY"]);
    const t0 = Date.now(); try { const r = await fetch("https://ai.gateway.lovable.dev/v1/models", { headers: { Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}` } }); console.log("[ai-pii] models", r.status, Date.now() - t0); } catch (e) { console.log("[ai-pii] models err", String(e)); }
    const { runAiPiiReview } = await import("./ai-pii.server");
    try {
      return { ok: true as const, review: await runAiPiiReview({ columns: data.columns }) };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "AI review failed" };
    }
  });
