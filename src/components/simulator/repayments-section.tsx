import { useStore } from "@tanstack/react-form"
import { CircleAlertIcon, PlusIcon } from "lucide-react"

import { scenarioFormOptions, withForm } from "@/components/form/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { duration, eur, pct, signedEur } from "@/lib/format"
import type { OfferResult, ScenarioResult } from "@/lib/finance/evaluate"
import { projectedIncome } from "@/lib/finance/income"
import type { Borrower, RepaymentRule, Scenario } from "@/lib/finance/types"
import { newId, newRepayment } from "@/lib/scenario/defaults"
import { useScenarioStore } from "@/lib/scenario/store"

import { ListItem } from "./list-item"
import { NumCell } from "./num-cell"
import { PlanDialog } from "./plan-dialog"
import { SeriesKey } from "./series"

const MODE_OPTIONS = [
  { value: "term" as const, label: "Shorten term" },
  { value: "payment" as const, label: "Lower payment" },
]

function describeRule(rule: RepaymentRule): string {
  const mode = rule.mode === "payment" ? "lower payment" : "shorten term"
  if (!rule.repeats) return `${eur(rule.amount)} once, end of year ${rule.fromYear}, ${mode}`
  const every = rule.everyYears > 1 ? `every ${rule.everyYears} years` : "every year"
  return `${eur(rule.amount)} ${every}, years ${rule.fromYear}–${rule.untilYear}, ${mode}`
}

function growthLabel(borrowers: Borrower[]): string {
  const raises = borrowers.filter((b) => b.enabled).map((b) => b.raisePct)
  if (!raises.length) return "no income"
  if (raises.every((r) => r === raises[0])) {
    return raises.length === 1 ? `income growing ${pct(raises[0])} a year` : `all incomes growing ${pct(raises[0])} a year`
  }
  const parts = raises.map((r) => pct(r))
  return `incomes growing ${parts.slice(0, -1).join(", ")} and ${parts.at(-1)} a year`
}

/** Hint on a "lower payment" repayment that keeps running after the payment has become comfortable. */
function ruleHint(rule: RepaymentRule, switchYear: number | null): string | null {
  if (!rule.enabled || rule.mode !== "payment" || !switchYear) return null
  const last = rule.repeats ? rule.untilYear : rule.fromYear
  if (last < switchYear) return null
  return rule.repeats && rule.fromYear < switchYear
    ? `From year ${switchYear} the payment is comfortable. Consider ending this at year ${switchYear - 1} and shortening the term after.`
    : `By year ${Math.max(rule.fromYear, switchYear)} the payment is comfortable. Shortening the term saves more here.`
}

function SwitchVerdict({
  reference,
  income,
  borrowers,
  comfortPct,
}: {
  reference: OfferResult | null
  income: number
  borrowers: Borrower[]
  comfortPct: number
}) {
  if (!reference) return null
  const year = reference.withRepayments.comfortableFromYear
  const shareNow = income > 0 ? (reference.withRepayments.schedule.firstPayment / income) * 100 : Number.NaN
  const name = reference.offer.name
  if (year === 1) {
    return (
      <p className="text-sm">
        <strong>Shorten the term from the start.</strong> On {name} the payment is already {pct(shareNow)} of income,
        under your {pct(comfortPct, 0)}.
      </p>
    )
  }
  if (year) {
    return (
      <p className="text-sm">
        <strong>Switch to shorten term from year {year}.</strong> On {name} the payment is {pct(shareNow)} of income
        today. With {growthLabel(borrowers)}, it stays under {pct(comfortPct, 0)} from year {year} (income about{" "}
        {eur(projectedIncome(borrowers, year))}/month).
      </p>
    )
  }
  return (
    <p className="text-sm">
      <strong>Keep lowering the payment.</strong> On {name} the payment doesn't drop under {pct(comfortPct, 0)} of
      income during the loan, with {growthLabel(borrowers)}.
    </p>
  )
}

export const RepaymentsSection = withForm({
  ...scenarioFormOptions,
  props: { result: undefined as unknown as ScenarioResult, scenario: undefined as unknown as Scenario },
  render: function RepaymentsSection({ form, result, scenario }) {
    const rules = useStore(form.store, (s) => s.values.repayments)
    const borrowers = useStore(form.store, (s) => s.values.borrowers)
    const comfortPct = useStore(form.store, (s) => s.values.comfortPct)
    const showInChart = useScenarioStore((s) => s.showRepaymentsInChart)
    const setShowInChart = useScenarioStore((s) => s.setShowRepaymentsInChart)
    const shown = result.offers.filter((r) => r.offer.enabled)
    // The switch check follows the cheapest offer that passes the bank test, or the first one shown.
    const reference = result.best ?? shown[0] ?? null
    const switchYear = reference?.withRepayments.comfortableFromYear ?? null

    return (
      <form.Field name="repayments" mode="array">
        {(list) => (
          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Early repayments (amortizações)</h2>
              </CardTitle>
              <CardDescription>
                {result.plannedRepayments > 0
                  ? `${eur(result.plannedRepayments)} planned in total, if the loan lasts long enough.`
                  : "No repayments planned. Add one to see its effect."}
              </CardDescription>
              <CardAction className="flex flex-wrap justify-end gap-2">
                <PlanDialog
                  scenario={scenario}
                  result={result}
                  onApply={(planned) => form.setFieldValue("repayments", planned.map((r) => ({ ...r, id: newId() })))}
                />
                <Button
                  onClick={() => {
                    const lastYear = rules.reduce((max, r) => Math.max(max, r.repeats ? r.untilYear : r.fromYear), 0)
                    list.pushValue(newRepayment({ fromYear: Math.min(lastYear + 1, 40) }))
                  }}
                >
                  <PlusIcon data-icon="inline-start" />
                  Add repayment
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {rules.length === 0 ? (
                <Empty className="border">
                  <EmptyHeader>
                    <EmptyTitle>No repayments yet</EmptyTitle>
                    <EmptyDescription>Plan a one-off amount or a yearly one with Add repayment.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(min(26rem,100%),1fr))] gap-3">
                  {rules.map((rule, i) => {
                    const hint = ruleHint(rule, switchYear)
                    return (
                      <ListItem
                        key={rule.id}
                        noun="repayment"
                        enabled={rule.enabled}
                        onToggle={() => form.setFieldValue(`repayments[${i}].enabled`, (v) => !v)}
                        onCopy={() => list.insertValue(i + 1, { ...rule, id: newId() })}
                        onRemove={() => list.removeValue(i)}
                        title={<span className="text-sm font-medium">{describeRule(rule)}</span>}
                        footer={
                          hint && (
                            <Alert>
                              <CircleAlertIcon />
                              <AlertDescription>{hint}</AlertDescription>
                            </Alert>
                          )
                        }
                      >
                        <FieldGroup className="grid grid-cols-2 gap-3">
                          <form.AppField name={`repayments[${i}].amount`}>
                            {(f) => <f.NumberField label="Amount" unit="€" step={500} min={0} />}
                          </form.AppField>
                          <form.AppField name={`repayments[${i}].repeats`}>
                            {(f) => <f.BooleanToggleField label="When" falseLabel="Once" trueLabel="Repeats" />}
                          </form.AppField>
                          <form.AppField name={`repayments[${i}].fromYear`}>
                            {(f) => (
                              <f.NumberField label={rule.repeats ? "From end of year" : "End of year"} min={1} max={40} />
                            )}
                          </form.AppField>
                          {rule.repeats && (
                            <>
                              <form.AppField name={`repayments[${i}].everyYears`}>
                                {(f) => <f.NumberField label="Every" unit="years" min={1} max={40} />}
                              </form.AppField>
                              <form.AppField name={`repayments[${i}].untilYear`}>
                                {(f) => <f.NumberField label="Until end of year" min={1} max={40} />}
                              </form.AppField>
                            </>
                          )}
                          <form.AppField name={`repayments[${i}].mode`}>
                            {(f) => <f.SelectField label="Then" options={MODE_OPTIONS} />}
                          </form.AppField>
                        </FieldGroup>
                      </ListItem>
                    )
                  })}
                </div>
              )}

              <FieldSet className="rounded-xl border p-4">
                <FieldLegend>When to switch to shorten term</FieldLegend>
                <FieldDescription>
                  Lowering the payment is worth it while the payment is a big share of income. Raises are set per
                  borrower in Household income.
                </FieldDescription>
                <FieldGroup className="grid gap-3 sm:grid-cols-2">
                  <form.AppField name="comfortPct">
                    {(f) => <f.NumberField label="Comfortable payment" unit="% of income" min={5} max={80} />}
                  </form.AppField>
                </FieldGroup>
                <SwitchVerdict reference={reference} income={result.income} borrowers={borrowers} comfortPct={comfortPct} />
              </FieldSet>

              <FieldGroup className="flex flex-row flex-wrap gap-x-8 gap-y-3">
                <form.AppField name="repaymentFeeWaived">
                  {(f) => <f.SwitchField label="Bank waives the repayment fee" className="w-auto" />}
                </form.AppField>
                <Field orientation="horizontal" className="w-auto">
                  <FieldLabel htmlFor="show-repayments-in-chart">Show repayments in the chart</FieldLabel>
                  <Switch id="show-repayments-in-chart" checked={showInChart} onCheckedChange={setShowInChart} />
                </Field>
              </FieldGroup>

              <RepaymentResults result={result} comfortPct={comfortPct} />
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
              Repayments are made at the end of each chosen year and applied top to bottom. Maximum fee: 2% while the
              rate is fixed, 0.5% while it's variable, plus 4% stamp duty on the fee. The variable-rate fee waiver ended
              on 31 Dec 2025.
            </CardFooter>
          </Card>
        )}
      </form.Field>
    )
  },
})

function RepaymentResults({ result, comfortPct }: { result: ScenarioResult; comfortPct: number }) {
  const shown = result.offers.filter((r) => r.offer.enabled)
  const cheapest = result.plannedRepayments > 0 ? result.bestWithRepayments : null
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Offer</TableHead>
          <TableHead className="text-right">Extra paid</TableHead>
          <TableHead className="text-right">Fees</TableHead>
          <TableHead className="text-right">Paid off in</TableHead>
          <TableHead className="text-right">Payment after</TableHead>
          <TableHead className="text-right">Switch from</TableHead>
          <TableHead className="text-right">Interest saved</TableHead>
          <TableHead className="text-right">Total cost</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {shown.map((r) => {
          const s = r.withRepayments.schedule
          const sooner = result.months - s.paidOffMonths
          const year = r.withRepayments.comfortableFromYear
          return (
            <TableRow key={r.offer.id} data-state={cheapest === r ? "selected" : undefined}>
              <TableCell className="min-w-40 whitespace-normal">
                <span className="flex items-center gap-2 font-medium">
                  <SeriesKey index={r.index} />
                  {r.offer.name}
                </span>
              </TableCell>
              <NumCell main={eur(s.extraPaid)} />
              <NumCell main={eur(s.repaymentFees)} />
              <NumCell main={duration(s.paidOffMonths)} sub={sooner > 0 ? `${duration(sooner)} sooner` : "full term"} />
              <NumCell
                main={s.paymentAfterRepayments == null ? "–" : eur(s.paymentAfterRepayments)}
                sub={
                  s.paymentAfterRepayments == null
                    ? undefined
                    : `${signedEur(s.paymentAfterRepayments - r.schedule.firstPayment)} vs start`
                }
              />
              <NumCell
                main={year === 1 ? "Now" : year ? `Year ${year}` : "Not reached"}
                sub={year ? `under ${pct(comfortPct, 0)} of income` : `stays above ${pct(comfortPct, 0)}`}
              />
              <NumCell main={eur(r.withRepayments.interestSaved)} sub="after fees" />
              <NumCell main={eur(r.withRepayments.totalCost)} sub={signedEur(r.withRepayments.totalCost - r.totalCost)} />
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
