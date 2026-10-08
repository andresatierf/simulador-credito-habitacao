import { useStore } from "@tanstack/react-form"
import { SparklesIcon } from "lucide-react"
import * as React from "react"

import { useAppForm } from "@/components/form/form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import { duration, eur, pct } from "@/lib/format"
import type { ScenarioResult } from "@/lib/finance/evaluate"
import { suggestRepaymentPlan, type RepaymentPlan } from "@/lib/finance/plan"
import type { RepaymentRule, Scenario } from "@/lib/finance/types"

function PlanSummary({ plan, comfortPct }: { plan: RepaymentPlan; comfortPct: number }) {
  const lower = plan.rules.find((r) => r.mode === "payment")
  if (plan.switchYear === null) {
    return (
      <p>
        <strong>Lower the payment every year from year {lower?.fromYear}.</strong> The payment doesn't drop under{" "}
        {pct(comfortPct, 0)} of income during the loan, so the plan keeps lowering it.
      </p>
    )
  }
  if (!lower) {
    return (
      <p>
        <strong>Shorten the term every year from year {plan.switchYear}.</strong> The payment is already under{" "}
        {pct(comfortPct, 0)} of income, so every repayment goes to ending the loan sooner.
      </p>
    )
  }
  return (
    <p>
      <strong>
        Lower the payment in years {lower.fromYear}–{lower.untilYear}, then shorten the term from year {plan.switchYear}
        .
      </strong>{" "}
      Year {plan.switchYear} is the first year the payment stays under {pct(comfortPct, 0)} of income.
    </p>
  )
}

export function PlanDialog({
  scenario,
  result,
  onApply,
}: {
  scenario: Scenario
  result: ScenarioResult
  onApply: (rules: Omit<RepaymentRule, "id">[]) => void
}) {
  const [open, setOpen] = React.useState(false)
  const shown = result.offers.filter((r) => r.offer.enabled)
  const defaultOffer = (result.best ?? shown[0])?.offer.id ?? ""

  const form = useAppForm({
    defaultValues: { amount: 5000, fromYear: 1, offerId: defaultOffer },
    onSubmit: ({ value }) => {
      const offer = scenario.offers.find((o) => o.id === value.offerId)
      const plan = offer && suggestRepaymentPlan(scenario, offer, value.amount, value.fromYear)
      if (!plan) return
      onApply(plan.rules)
      setOpen(false)
    },
  })
  const values = useStore(form.store, (s) => s.values)
  const offerResult = result.offers.find((r) => r.offer.id === values.offerId)
  const plan = React.useMemo(
    () =>
      offerResult && Number.isFinite(values.amount) && Number.isFinite(values.fromYear)
        ? suggestRepaymentPlan(scenario, offerResult.offer, values.amount, values.fromYear)
        : null,
    [scenario, offerResult, values.amount, values.fromYear],
  )

  const base = offerResult?.schedule
  const interestSaved = plan && base ? (base.interest - plan.schedule.interest) * 1.04 - plan.schedule.repaymentFees : 0
  // Payment once the "lower payment" phase is over: the month after its last repayment.
  const lowerUntil = plan?.rules.find((r) => r.mode === "payment")?.untilYear
  const loweredPayment =
    plan && lowerUntil != null && lowerUntil * 12 < plan.schedule.paidOffMonths ? plan.schedule.payments[lowerUntil * 12] : null

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) form.reset({ amount: values.amount, fromYear: values.fromYear, offerId: defaultOffer })
        setOpen(next)
      }}
    >
      <DialogTrigger render={<Button variant="outline" disabled={shown.length === 0} />}>
        <SparklesIcon data-icon="inline-start" />
        Suggest a plan
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void form.handleSubmit()
          }}
          className="flex flex-col gap-4"
        >
          <DialogHeader>
            <DialogTitle>Suggest an early repayment plan</DialogTitle>
            <DialogDescription>
              Lowers the payment while it's above your comfortable share of income ({pct(scenario.comfortPct, 0)}),
              then shortens the term, which saves the most interest.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="grid grid-cols-2 gap-3">
            <form.AppField name="amount">
              {(f) => <f.NumberField label="Amount per year" unit="€" step={500} min={0} />}
            </form.AppField>
            <form.AppField name="fromYear">
              {(f) => <f.NumberField label="From end of year" min={1} max={scenario.property.termYears} />}
            </form.AppField>
            <form.AppField name="offerId">
              {(f) => (
                <f.SelectField
                  className="col-span-2"
                  label="Plan for offer"
                  options={shown.map((r) => ({ value: r.offer.id, label: r.offer.name }))}
                />
              )}
            </form.AppField>
          </FieldGroup>

          {plan && base ? (
            <div className="flex flex-col gap-3 rounded-lg bg-muted/60 p-3 text-sm">
              <PlanSummary plan={plan} comfortPct={scenario.comfortPct} />
              <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 tabular-nums">
                <dt className="text-muted-foreground">Paid off in</dt>
                <dd className="text-right font-medium">
                  {duration(plan.schedule.paidOffMonths)}
                  {plan.schedule.paidOffMonths < result.months &&
                    ` (${duration(result.months - plan.schedule.paidOffMonths)} sooner)`}
                </dd>
                <dt className="text-muted-foreground">Interest saved, after fees</dt>
                <dd className="text-right font-medium">{eur(interestSaved)}</dd>
                <dt className="text-muted-foreground">Extra paid in</dt>
                <dd className="text-right font-medium">{eur(plan.schedule.extraPaid)}</dd>
                {loweredPayment != null && (
                  <>
                    <dt className="text-muted-foreground">Payment after year {lowerUntil}</dt>
                    <dd className="text-right font-medium">
                      {eur(base.firstPayment)} → {eur(loweredPayment)}
                    </dd>
                  </>
                )}
              </dl>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Enter an amount and a year within the loan term.</p>
          )}

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
            <Button type="submit" disabled={!plan}>
              {scenario.repayments.length > 0 ? `Replace ${scenario.repayments.length} repayment${scenario.repayments.length === 1 ? "" : "s"}` : "Use this plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
