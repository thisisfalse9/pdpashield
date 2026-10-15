// Internal PDPA readiness estimate. NOT an official PDPC assessment or certification.
export type Answer = "Yes" | "Partial" | "No" | "N/A" | "";

export interface Control {
  id: string;
  obligation: string;
  question: string;
  weight: number;
}

export const ANSWER_VALUE: Record<Exclude<Answer, "N/A" | "">, number> = { Yes: 1, Partial: 0.5, No: 0 };

/** Weighted score over applicable, answered controls. N/A and unanswered are excluded. */
export function calcScore(controls: Control[], answers: Record<string, Answer>): number {
  let total = 0;
  let got = 0;
  for (const c of controls) {
    const a = answers[c.id];
    if (!a || a === "N/A") continue;
    total += c.weight;
    got += c.weight * ANSWER_VALUE[a];
  }
  return total === 0 ? 0 : Math.round((got / total) * 100);
}

export function riskScore(likelihood: number, impact: number) {
  const s = likelihood * impact; // 1..25
  const level = s >= 15 ? "High" : s >= 8 ? "Medium" : "Low";
  return { score: s, level } as const;
}
