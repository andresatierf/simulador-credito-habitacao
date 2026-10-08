import { CheckIcon, InfoIcon, XIcon } from "lucide-react";
import type * as React from "react";

import { scenarioFormOptions, withForm } from "@/components/form/form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { eur, pct } from "@/lib/format";
import type { ScenarioResult } from "@/lib/finance/evaluate";
import { MACROPRUDENTIAL, YOUTH_GUARANTEE } from "@/lib/finance/rules";

function Check({ ok, info, children }: { ok?: boolean; info?: boolean; children: React.ReactNode }) {
  if (info) {
    return (
      <Badge variant="secondary">
        <InfoIcon data-icon="inline-start" />
        {children}
      </Badge>
    );
  }
  return (
    <Badge variant={ok ? "success" : "destructive"}>
      {ok ? <CheckIcon data-icon="inline-start" /> : <XIcon data-icon="inline-start" />}
      {children}
    </Badge>
  );
}

export const PropertySection = withForm({
  ...scenarioFormOptions,
  props: { result: undefined as unknown as ScenarioResult },
  render: function PropertySection({ form, result }) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Property and loan</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <FieldGroup className="grid grid-cols-2 gap-3">
            <form.AppField name="property.price">
              {(f) => <f.NumberField label="Purchase price" unit="€" step={5000} min={0} />}
            </form.AppField>
            <form.AppField name="property.valuation">
              {(f) => <f.NumberField label="Bank valuation" unit="€" step={5000} min={0} />}
            </form.AppField>
            <form.AppField name="property.downPayment">
              {(f) => <f.NumberField label="Down payment" unit="€" step={5000} min={0} />}
            </form.AppField>
            <form.AppField
              name="property.termYears"
              listeners={{
                onChange: ({ value }) => {
                  if (Number.isFinite(value))
                    form.setFieldValue("market.stressShockPp", MACROPRUDENTIAL.shockPp(value));
                },
              }}
            >
              {(f) => <f.NumberField label="Term" unit="years" min={5} max={40} />}
            </form.AppField>
          </FieldGroup>
          <FieldGroup className="gap-3">
            <form.AppField name="property.allBuyersUnder35">
              {(f) => <f.CheckboxField label="Every buyer is 35 or under" />}
            </form.AppField>
            <form.AppField name="property.firstHome">
              {(f) => <f.CheckboxField label="First home, permanent residence, nobody owns a home" />}
            </form.AppField>
            <form.AppField name="property.otherClosingCosts">
              {(f) => (
                <f.NumberField
                  label="Other closing costs"
                  description="Valuation, deed and registration."
                  unit="€"
                  step={50}
                  min={0}
                />
              )}
            </form.AppField>
          </FieldGroup>
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-sm tabular-nums">
            <dt className="text-muted-foreground">Loan amount</dt>
            <dd className="text-right font-medium">{eur(result.loan)}</dd>
            <dt className="text-muted-foreground">LTV (on the lower of price and valuation)</dt>
            <dd className="text-right font-medium">{pct(result.ltvPct)}</dd>
          </dl>
          <form.Subscribe selector={(s) => s.values.property.termYears}>
            {(term) => (
              <div className="flex flex-wrap gap-1.5">
                {result.ltvPct > 100 ? (
                  <Check>Loan above property value</Check>
                ) : result.needsGuarantee ? (
                  result.guaranteeEligible ? (
                    <Check ok>State guarantee covers LTV over 90%</Check>
                  ) : (
                    <Check>LTV over 90% needs the State guarantee</Check>
                  )
                ) : (
                  <Check ok>LTV within 90%</Check>
                )}
                {result.youthEligible && (
                  <Check ok={result.guaranteeEligible}>
                    {result.guaranteeEligible
                      ? `Within the ${eur(YOUTH_GUARANTEE.maxPropertyValue)} guarantee limit`
                      : `Above the ${eur(YOUTH_GUARANTEE.maxPropertyValue)} guarantee limit`}
                  </Check>
                )}
                {result.youthEligible ? (
                  <Check ok>IMT exemption (≤35)</Check>
                ) : (
                  <Check info>Standard IMT applies</Check>
                )}
                <Check ok={term <= result.maxTermYears}>
                  {term <= result.maxTermYears
                    ? `Term within ${result.maxTermYears} years`
                    : `Max term is ${result.maxTermYears} years`}
                </Check>
              </div>
            )}
          </form.Subscribe>
        </CardContent>
      </Card>
    );
  },
});
