import { scenarioFormOptions, withForm } from "@/components/form/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";

const signedPp = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(2)} pp`;

export const MarketSection = withForm({
  ...scenarioFormOptions,
  render: function MarketSection({ form }) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Market and stress test</h2>
          </CardTitle>
          <CardDescription>
            Euribor from 7 Oct 2026. The stress shock follows Recomendação 1/2026 (+0.5 pp up to 5 years, +1.0 pp up to
            10, +1.5 pp above) and updates when you change the term.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid grid-cols-2 gap-3">
            <form.AppField name="market.euribor6mPct">
              {(f) => <f.NumberField label="Euribor 6M" unit="%" step={0.01} />}
            </form.AppField>
            <form.AppField name="market.euribor12mPct">
              {(f) => <f.NumberField label="Euribor 12M" unit="%" step={0.01} />}
            </form.AppField>
            <form.AppField name="market.maxDstiPct">
              {(f) => <f.NumberField label="Max taxa de esforço" unit="%" min={10} max={80} />}
            </form.AppField>
            <form.AppField name="market.stressShockPp">
              {(f) => <f.NumberField label="Stress shock" unit="pp" step={0.25} min={0} max={5} />}
            </form.AppField>
            <form.AppField name="market.euriborDriftPp">
              {(f) => (
                <f.SliderField
                  className="col-span-2"
                  label="Euribor change after today"
                  description="Moves future payments and total cost. It doesn't change the bank test."
                  min={-2}
                  max={4}
                  step={0.25}
                  format={signedPp}
                />
              )}
            </form.AppField>
          </FieldGroup>
        </CardContent>
      </Card>
    );
  },
});
