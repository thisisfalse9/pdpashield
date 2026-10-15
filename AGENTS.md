<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- App state lives in a browser-local store (`src/lib/store.ts`, localStorage) with seed data in `src/lib/seed.ts`; no backend yet, so role permissions are UI-only — move to Lovable Cloud before claiming server enforcement.
- Pure business rules (PII detection/masking, PDPA score, AI risk) live in `src/lib/*.ts` with tests in `src/test/rules.test.ts`; keep UI free of scoring logic so rules stay testable.
- Anything simulated must be labelled Demo Data / Not Connected in the UI; never imply live integrations.
- tsconfig relaxes noUncheckedIndexedAccess/exactOptionalPropertyTypes/noImplicitReturns to keep page code readable.
