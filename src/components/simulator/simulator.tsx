import { useStore } from "@tanstack/react-form"
import { useNavigate, useSearch } from "@tanstack/react-router"
import * as React from "react"

import { scenarioFormOptions, useAppForm } from "@/components/form/form"
import { toast } from "@/components/ui/toast"
import { evaluateScenario } from "@/lib/finance/evaluate"
import type { Scenario } from "@/lib/finance/types"
import { decodeScenario, encodeScenario } from "@/lib/scenario/codec"
import { defaultScenario } from "@/lib/scenario/defaults"
import { useScenarioStore } from "@/lib/scenario/store"

import { AppHeader } from "./app-header"
import { BorrowersSection } from "./borrowers-section"
import { MarketSection } from "./market-section"
import { Notes } from "./notes"
import { OffersSection } from "./offers-section"
import { PaymentChart } from "./payment-chart"
import { PropertySection } from "./property-section"
import { RepaymentsSection } from "./repayments-section"
import {
  CashAtSigning,
  ComparisonTable,
  DeadlineAlert,
  SummaryStats,
} from "./results"
import { WealthSection } from "./wealth-section"

/** A link wins over the saved draft; the draft wins over the defaults. */
function initialScenario(linked: string | undefined): Scenario {
  if (linked) {
    const fromLink = decodeScenario(linked)
    if (fromLink) return fromLink
  }
  return useScenarioStore.getState().draft ?? defaultScenario()
}

/** Keeps the last scenario that passed validation, so results don't flash while a field is mid-edit. */
function useLastValid(values: Scenario, isValid: boolean): Scenario {
  const [lastValid, setLastValid] = React.useState(values)
  if (isValid && values !== lastValid) setLastValid(values)
  return isValid ? values : lastValid
}

export function Simulator() {
  const search = useSearch({ from: "/" })
  const navigate = useNavigate({ from: "/" })
  const setDraft = useScenarioStore((s) => s.setDraft)
  const showRepaymentsInChart = useScenarioStore((s) => s.showRepaymentsInChart)
  // The form re-applies its options on every render, so replacing the scenario must change these defaults too;
  // `form.reset(next)` alone is undone on the next render.
  const [defaults, setDefaults] = React.useState(() =>
    initialScenario(search.s)
  )

  const form = useAppForm({ ...scenarioFormOptions, defaultValues: defaults })
  const values = useStore(form.store, (s) => s.values)
  const isValid = useStore(form.store, (s) => s.isValid)
  const scenario = useLastValid(values, isValid)
  const deferred = React.useDeferredValue(scenario)
  const result = React.useMemo(() => evaluateScenario(deferred), [deferred])

  // Save the draft and mirror the scenario in the URL, so a refresh or a copied address keeps it.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDraft(scenario)
      // Keep the reader where they are: by default every navigation scrolls to the top.
      void navigate({
        search: { s: encodeScenario(scenario) },
        replace: true,
        resetScroll: false,
      })
    }, 400)
    return () => clearTimeout(timer)
  }, [scenario, setDraft, navigate])

  const replaceScenario = React.useCallback(
    (next: Scenario, message: string) => {
      setDefaults(next)
      form.reset(next)
      toast.add({ title: message })
    },
    [form]
  )

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-7 sm:px-6">
      <AppHeader
        getScenario={() => scenario}
        onLoad={(next) => replaceScenario(next, "Scenario loaded")}
        onReset={() => replaceScenario(defaultScenario(), "Reset to defaults")}
      />
      <div className="grid items-start gap-5 min-[960px]:grid-cols-[minmax(400px,440px)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <BorrowersSection form={form} result={result} />
          <PropertySection form={form} result={result} />
          <MarketSection form={form} />
          <CashAtSigning result={result} scenario={scenario} />
          <WealthSection form={form} result={result} />
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <DeadlineAlert result={result} />
          <SummaryStats
            result={result}
            maxDstiPct={scenario.market.maxDstiPct}
          />
          <ComparisonTable result={result} />
          <RepaymentsSection form={form} result={result} scenario={scenario} />
          <PaymentChart
            result={result}
            borrowers={scenario.borrowers}
            comfortPct={scenario.comfortPct}
            otherDebtMonthly={scenario.otherDebtMonthly}
            withRepayments={showRepaymentsInChart}
          />
          <OffersSection form={form} />
          <Notes />
        </div>
      </div>
    </div>
  )
}
