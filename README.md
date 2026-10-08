# Simulador Crédito Habitação

Compare Portuguese mortgage offers against the Banco de Portugal affordability rule (45% taxa de esforço with the rate stress test). For each offer it shows the monthly payment, whether the bank would approve it, the largest loan it allows, the total cost, the cash needed at signing (IMT and stamp duty, including the under-35 exemption), and the effect of early repayments.

Everything runs in the browser. There is no server and no data leaves the device: the current scenario is kept in local storage and in the URL (`?s=…`), so a link reproduces exactly what you see.

## Commands

```bash
bun install
bun run dev        # http://localhost:5173
bun run test       # finance tests (Vitest)
bun run lint
bun run build      # static site in dist/, installable as a PWA
```

## How it's organised

- `src/lib/finance/` — all calculations as plain TypeScript, no React: annuity maths, rate schedules, the bank stress test, early repayments, taxes, income projection, the switch-year check and `evaluateScenario`. Covered by `finance.test.ts`.
- `src/lib/finance/rules.ts` — the regulatory parameters (DSTI limit, stress shocks, IMT table, youth exemption thresholds, guarantee limit and deadline, repayment fees). Update this file when the rules change.
- `src/lib/scenario/` — default scenario, Zod schema (form validation and parsing of links and saved data), URL encoding, and the Zustand store for saved scenarios.
- `src/components/form/` — TanStack Form hook and field components built on shadcn's `Field`.
- `src/components/simulator/` — page sections.

## Caveats

The default offers are indicative public rates from July–August 2026, mostly quoted at 80% LTV. Replace them with the figures from each bank's FINE. Banks differ in how they run the stress test on mixed rates. This is a simulator, not a bank proposal.
