import { useStore } from "@tanstack/react-form";
import { TriangleAlertIcon } from "lucide-react";

import { scenarioFormOptions, withForm } from "@/components/form/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { eur, signedEur } from "@/lib/format";
import type { ScenarioResult } from "@/lib/finance/evaluate";

export const WealthSection = withForm({
  ...scenarioFormOptions,
  props: { result: undefined as unknown as ScenarioResult },
  render: function WealthSection({ form, result }) {
    const w = result.wealth;
    const investments = useStore(form.store, (s) => s.values.wealth.investments);
    const downPayment = useStore(form.store, (s) => s.values.property.downPayment);
    const short = w.cashAfterSigning < 0;
    const shortfall = -w.cashAfterSigning;
    const shortHint =
      investments >= shortfall
        ? "Your investments could cover it."
        : downPayment > 0
          ? "A smaller down payment leaves more cash, if the bank finances the difference."
          : "Even with 100% financing, taxes and fees are paid in cash.";
    const reserve =
      w.reserveMonths == null
        ? "–"
        : w.reserveMonths >= 1
          ? `${w.reserveMonths.toFixed(1).replace(".", ",")} months`
          : "under a month";
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Net worth at the start</h2>
          </CardTitle>
          <CardDescription>
            What you own and owe before buying, and where it stands right after signing.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <FieldGroup className="grid grid-cols-2 gap-3">
            <form.AppField name="wealth.cash">
              {(f) => <f.NumberField label="Cash and deposits" unit="€" step={1000} min={0} />}
            </form.AppField>
            <form.AppField name="wealth.investments">
              {(f) => <f.NumberField label="Investments" unit="€" step={1000} min={0} />}
            </form.AppField>
            <form.AppField name="wealth.debtBalance">
              {(f) => (
                <f.NumberField
                  className="col-span-2"
                  label="Other debts outstanding"
                  description="What's left to repay on car loans, personal credit and cards."
                  unit="€"
                  step={500}
                  min={0}
                />
              )}
            </form.AppField>
          </FieldGroup>

          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-sm tabular-nums">
            <dt className="text-muted-foreground">Net worth now</dt>
            <dd className="text-right font-medium">{eur(w.netWorthBefore)}</dd>
            <dt className="text-muted-foreground">Cash due at signing</dt>
            <dd className="text-right font-medium">−{eur(result.cashAtSigning)}</dd>
            <dt className="text-muted-foreground">Cash left after signing</dt>
            <dd className={short ? "text-right font-medium text-destructive" : "text-right font-medium"}>
              {eur(w.cashAfterSigning)}
            </dd>
            <dt className="text-muted-foreground">Covers loan payments for</dt>
            <dd className="text-right font-medium">{reserve}</dd>
          </dl>
          <Separator />
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-sm tabular-nums">
            <dt className="text-muted-foreground">Taxes and fees (spent)</dt>
            <dd className="text-right font-medium">−{eur(w.purchaseCosts)}</dd>
            <dt className="font-semibold">Net worth after buying</dt>
            <dd className="text-right font-semibold">
              {eur(w.netWorthAfter)}
              <span className="block text-xs font-normal text-muted-foreground">
                {signedEur(w.netWorthAfter - w.netWorthBefore)}
              </span>
            </dd>
          </dl>

          {short && (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>Savings don't cover the cash due at signing</AlertTitle>
              <AlertDescription>
                You're {eur(shortfall)} short. {shortHint}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          The home counts at the bank valuation, minus the loan. The down payment isn't a loss: it becomes equity in the
          home. Monthly cover uses the best offer's payment, insurance and other debt payments.
        </CardFooter>
      </Card>
    );
  },
});
