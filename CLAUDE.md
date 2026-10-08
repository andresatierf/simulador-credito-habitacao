# Simulador Crédito Habitação

Client-only React app (Vite, TypeScript, TanStack Router + Form, Zustand, Zod, shadcn on Base UI, Tailwind v4). Package manager: bun. UI is English only.

## Commands

- `bun run test` — Vitest; run after any change in `src/lib/finance/`.
- `bunx tsc -p tsconfig.app.json --noEmit` — type check.
- `bun run lint`, `bun run build`.

## Rules

- Calculations live in `src/lib/finance/` and never import React. Components only display `evaluateScenario` results.
- Legal and regulatory numbers live only in `src/lib/finance/rules.ts`. When changing one, update the tests that pin it.
- The finance tests pin figures checked by hand (e.g. €350k over 40 years at 3.45% = €1,345/month; switch year 5 with the default scenario). Don't change an expected value to make a test pass without re-deriving it.
- The scenario shape is defined three times and must stay in sync: `finance/types.ts`, `scenario/schema.ts` (Zod), and `scenario/defaults.ts`. When adding a field, also handle old links and saved data in `scenario/codec.ts` (`migrate`).
- Form fields use the components registered in `components/form/form.ts` (`form.AppField` + `f.NumberField` etc.). Inside list sections, read items from `useStore(form.store, …)`, not from the array field's state, which doesn't re-render on item changes.
- Use shadcn components and semantic tokens; offer colors come from `--series-1…8` via `seriesColor(index)`.
