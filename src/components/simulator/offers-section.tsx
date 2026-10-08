import { useStore } from "@tanstack/react-form";
import { PlusIcon } from "lucide-react";

import { scenarioFormOptions, withForm } from "@/components/form/form";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { pct } from "@/lib/format";
import { EARLY_REPAYMENT_FEE_PCT } from "@/lib/finance/rules";
import { newId, newOffer } from "@/lib/scenario/defaults";

import { ListItem } from "./list-item";
import { SeriesKey } from "./series";

export const MAX_OFFERS = 8;

const TYPE_OPTIONS = [
  { value: "fixed" as const, label: "Fixed" },
  { value: "variable" as const, label: "Variable" },
  { value: "mixed" as const, label: "Mixed" },
];
const INDEX_OPTIONS = [
  { value: "6m" as const, label: "Euribor 6M" },
  { value: "12m" as const, label: "Euribor 12M" },
];

export const OffersSection = withForm({
  ...scenarioFormOptions,
  render: function OffersSection({ form }) {
    const offers = useStore(form.store, (s) => s.values.offers);
    return (
      <form.Field name="offers" mode="array">
        {(list) => (
          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Bank offers</h2>
              </CardTitle>
              <CardDescription>
                The starting offers are indicative public rates from July–August 2026, mostly quoted at 80% LTV. Replace
                them with the figures from each bank's FINE.
              </CardDescription>
              <CardAction>
                <Button
                  onClick={() => list.pushValue(newOffer(`Offer ${offers.length + 1}`))}
                  disabled={offers.length >= MAX_OFFERS}
                >
                  <PlusIcon data-icon="inline-start" />
                  Add offer
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="grid grid-cols-[repeat(auto-fill,minmax(min(22rem,100%),1fr))] gap-3">
              {offers.map((offer, i) => (
                <ListItem
                  key={offer.id}
                  noun="offer"
                  enabled={offer.enabled}
                  onToggle={() => form.setFieldValue(`offers[${i}].enabled`, (v) => !v)}
                  onCopy={() =>
                    list.insertValue(i + 1, {
                      ...offer,
                      id: newId(),
                      name: `${offer.name} (copy)`,
                    })
                  }
                  onRemove={() => list.removeValue(i)}
                  canCopy={offers.length < MAX_OFFERS}
                  title={
                    <div className="flex items-center gap-2">
                      <SeriesKey index={i} shape="square" />
                      <form.AppField name={`offers[${i}].name`}>
                        {(f) => <f.TextField label="Offer name" srOnlyLabel />}
                      </form.AppField>
                    </div>
                  }
                >
                  <form.AppField name={`offers[${i}].type`}>
                    {(f) => <f.ToggleGroupField label="Rate type" options={TYPE_OPTIONS} />}
                  </form.AppField>
                  <FieldGroup className="grid grid-cols-2 gap-3">
                    {offer.type !== "variable" && (
                      <form.AppField name={`offers[${i}].fixedRatePct`}>
                        {(f) => <f.NumberField label="Fixed rate (TAN)" unit="%" step={0.05} />}
                      </form.AppField>
                    )}
                    {offer.type === "mixed" && (
                      <form.AppField name={`offers[${i}].fixedYears`}>
                        {(f) => <f.NumberField label="Fixed period" unit="years" min={0} max={40} />}
                      </form.AppField>
                    )}
                    {offer.type !== "fixed" && (
                      <>
                        <form.AppField name={`offers[${i}].index`}>
                          {(f) => (
                            <f.SelectField
                              label={offer.type === "mixed" ? "Then index" : "Index"}
                              options={INDEX_OPTIONS}
                            />
                          )}
                        </form.AppField>
                        <form.AppField name={`offers[${i}].spreadPct`}>
                          {(f) => (
                            <f.NumberField
                              label={offer.type === "mixed" ? "Then spread" : "Spread"}
                              unit="%"
                              step={0.05}
                            />
                          )}
                        </form.AppField>
                      </>
                    )}
                    {offer.type === "variable" && (
                      <>
                        <form.AppField name={`offers[${i}].promoSpreadPct`}>
                          {(f) => <f.NumberField label="Promo spread" unit="%" step={0.05} />}
                        </form.AppField>
                        <form.AppField name={`offers[${i}].promoYears`}>
                          {(f) => <f.NumberField label="Promo period" unit="years" min={0} max={40} />}
                        </form.AppField>
                      </>
                    )}
                    <form.AppField name={`offers[${i}].insuranceMonthly`}>
                      {(f) => <f.NumberField label="Insurance (life + home)" unit="€/mo" step={5} min={0} />}
                    </form.AppField>
                    <form.AppField name={`offers[${i}].feesOneOff`}>
                      {(f) => <f.NumberField label="Bank fees (one-off)" unit="€" step={50} min={0} />}
                    </form.AppField>
                    {offer.type !== "variable" && (
                      <form.AppField name={`offers[${i}].repaymentFeeFixedPct`}>
                        {(f) => (
                          <f.NumberField
                            label={offer.type === "mixed" ? "Repayment fee, fixed period" : "Repayment fee"}
                            description={`Max ${pct(EARLY_REPAYMENT_FEE_PCT.fixed, 0)}`}
                            unit="%"
                            step={0.25}
                            min={0}
                            max={EARLY_REPAYMENT_FEE_PCT.fixed}
                          />
                        )}
                      </form.AppField>
                    )}
                    {offer.type !== "fixed" && (
                      <form.AppField name={`offers[${i}].repaymentFeeVariablePct`}>
                        {(f) => (
                          <f.NumberField
                            label={offer.type === "mixed" ? "Repayment fee, after" : "Repayment fee"}
                            description={`Max ${pct(EARLY_REPAYMENT_FEE_PCT.variable, 1)}`}
                            unit="%"
                            step={0.1}
                            min={0}
                            max={EARLY_REPAYMENT_FEE_PCT.variable}
                          />
                        )}
                      </form.AppField>
                    )}
                  </FieldGroup>
                </ListItem>
              ))}
            </CardContent>
          </Card>
        )}
      </form.Field>
    );
  },
});
