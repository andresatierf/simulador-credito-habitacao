import { useStore } from "@tanstack/react-form"
import { PlusIcon } from "lucide-react"

import { scenarioFormOptions, withForm } from "@/components/form/form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, FieldSeparator } from "@/components/ui/field"
import { eur, pct } from "@/lib/format"
import type { ScenarioResult } from "@/lib/finance/evaluate"
import { newBorrower, newId } from "@/lib/scenario/defaults"

import { ListItem } from "./list-item"

/** Banks usually accept up to four borrowers on one loan. */
export const MAX_BORROWERS = 4

const PAYMENTS_OPTIONS = [
  { value: 12 as const, label: "12 (duodécimos)" },
  { value: 14 as const, label: "14" },
]

export const BorrowersSection = withForm({
  ...scenarioFormOptions,
  props: { result: undefined as unknown as ScenarioResult },
  render: function BorrowersSection({ form, result }) {
    const borrowers = useStore(form.store, (s) => s.values.borrowers)
    const maxDstiPct = useStore(form.store, (s) => s.values.market.maxDstiPct)
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Household income</h2>
          </CardTitle>
          <CardDescription>Coverflex-style benefits usually aren't counted. Ask each bank what share it accepts.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form.Field name="borrowers" mode="array">
            {(list) => (
              <div className="flex flex-col gap-3">
                {borrowers.map((borrower, i) => (
                  <ListItem
                    key={borrower.id}
                    noun="borrower"
                    enabled={borrower.enabled}
                    onToggle={() => form.setFieldValue(`borrowers[${i}].enabled`, (v) => !v)}
                    onCopy={() => list.insertValue(i + 1, { ...borrower, id: newId(), name: `${borrower.name} (copy)` })}
                    onRemove={() => list.removeValue(i)}
                    canCopy={borrowers.length < MAX_BORROWERS}
                    canRemove={borrowers.length > 1}
                    title={
                      <form.AppField name={`borrowers[${i}].name`}>
                        {(f) => <f.TextField label="Borrower name" srOnlyLabel />}
                      </form.AppField>
                    }
                  >
                    <FieldGroup className="grid grid-cols-2 gap-3">
                      <form.AppField name={`borrowers[${i}].netPerPayment`}>
                        {(f) => <f.NumberField label="Net per payment" unit="€" step={50} min={0} />}
                      </form.AppField>
                      <form.AppField name={`borrowers[${i}].paymentsPerYear`}>
                        {(f) => <f.SelectField label="Payments per year" options={PAYMENTS_OPTIONS} />}
                      </form.AppField>
                      <form.AppField name={`borrowers[${i}].benefitsMonthly`}>
                        {(f) => <f.NumberField label="Flexible benefits" unit="€/mo" step={25} min={0} />}
                      </form.AppField>
                      <form.AppField name={`borrowers[${i}].benefitsCountedPct`}>
                        {(f) => <f.NumberField label="Share the bank counts" unit="%" step={10} min={0} max={100} />}
                      </form.AppField>
                      <form.AppField name={`borrowers[${i}].raisePct`}>
                        {(f) => <f.NumberField label="Expected raise" unit="%/yr" step={0.5} />}
                      </form.AppField>
                    </FieldGroup>
                  </ListItem>
                ))}
                <Button
                  variant="outline"
                  onClick={() => list.pushValue(newBorrower(`Borrower ${borrowers.length + 1}`))}
                  disabled={borrowers.length >= MAX_BORROWERS}
                >
                  <PlusIcon data-icon="inline-start" />
                  Add borrower
                </Button>
              </div>
            )}
          </form.Field>
          <FieldSeparator />
          <form.AppField name="otherDebtMonthly">
            {(f) => (
              <f.NumberField
                label="Other loan payments"
                description="Car, cards and personal credit count against the limit."
                unit="€/mo"
                step={25}
                min={0}
              />
            )}
          </form.AppField>
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-sm tabular-nums">
            <dt className="text-muted-foreground">Monthly income the bank counts</dt>
            <dd className="text-right font-medium">{eur(result.income)}</dd>
            <dt className="text-muted-foreground">
              Max payment at {pct(maxDstiPct, 0)}
            </dt>
            <dd className="text-right font-medium">{eur(result.maxPayment)}</dd>
          </dl>
        </CardContent>
      </Card>
    )
  },
})

