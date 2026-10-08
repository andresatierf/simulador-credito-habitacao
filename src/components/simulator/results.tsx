import { CheckIcon, HourglassIcon, XIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { eur, pct, signedEur } from "@/lib/format"
import type { OfferResult, ScenarioResult } from "@/lib/finance/evaluate"
import { YOUTH_GUARANTEE, YOUTH_TAX_EXEMPTION } from "@/lib/finance/rules"
import type { Offer, Scenario } from "@/lib/finance/types"

import { NumCell } from "./num-cell"
import { SeriesKey } from "./series"

const rate = (v: number) => pct(v, 2)

function describeOffer(o: Offer): string {
  const index = o.index === "12m" ? "E12M" : "E6M"
  if (o.type === "fixed")
    return `Fixed ${rate(o.fixedRatePct)} for the whole term`
  if (o.type === "mixed")
    return `${rate(o.fixedRatePct)} for ${o.fixedYears} yrs, then ${index} + ${rate(o.spreadPct)}`
  if (o.promoYears > 0)
    return `${index} + ${rate(o.promoSpreadPct)} for ${o.promoYears} yrs, then + ${rate(o.spreadPct)}`
  return `${index} + ${rate(o.spreadPct)}`
}

export function DeadlineAlert({ result }: { result: ScenarioResult }) {
  if (!(result.youthEligible && result.needsGuarantee)) return null
  const deadline = new Date(YOUTH_GUARANTEE.deadline).toLocaleDateString(
    "en-GB",
    { day: "numeric", month: "short", year: "numeric" }
  )
  return (
    <Alert>
      <HourglassIcon />
      <AlertTitle>State guarantee deadline: {deadline}</AlertTitle>
      <AlertDescription>
        100% financing for buyers aged 35 or under needs the deed signed by
        then. An extension in the OE2027 budget is only proposed so far.
      </AlertDescription>
    </Alert>
  )
}

function Stat({
  label,
  value,
  note,
}: {
  label: string
  value: string
  note: string
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 bg-card p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-2xl font-semibold tracking-tight">{value}</span>
      <span className="truncate text-xs text-muted-foreground">{note}</span>
    </div>
  )
}

export function SummaryStats({
  result,
  maxDstiPct,
}: {
  result: ScenarioResult
  maxDstiPct: number
}) {
  const shown = result.offers.filter((r) => r.offer.enabled)
  const passing = shown.filter((r) => r.passes).length
  return (
    <section
      aria-label="Summary"
      className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border ring-1 ring-foreground/10 lg:grid-cols-4"
    >
      <Stat
        label="Lowest payment that passes"
        value={
          result.lowestPayment
            ? eur(result.lowestPayment.schedule.firstPayment)
            : "None"
        }
        note={
          result.lowestPayment?.offer.name ??
          "Lower the loan or find a better fixed rate."
        }
      />
      <Stat
        label="Lowest total cost that passes"
        value={result.best ? eur(result.best.totalCost) : "None"}
        note={result.best?.offer.name ?? "–"}
      />
      <Stat
        label="Offers that pass the bank test"
        value={`${passing} of ${shown.length}`}
        note={`at the ${pct(maxDstiPct, 0)} limit`}
      />
      <Stat
        label="Cash you need at signing"
        value={eur(result.cashAtSigning)}
        note="down payment, taxes, fees"
      />
    </section>
  )
}

function PassBadge({ r }: { r: OfferResult }) {
  return (
    <Badge variant={r.passes ? "success" : "destructive"}>
      {r.passes ? (
        <CheckIcon data-icon="inline-start" />
      ) : (
        <XIcon data-icon="inline-start" />
      )}
      {pct(r.dstiPct)}
    </Badge>
  )
}

export function ComparisonTable({ result }: { result: ScenarioResult }) {
  const shown = result.offers.filter((r) => r.offer.enabled)
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Comparison</h2>
        </CardTitle>
        <CardDescription>
          The highlighted row is the cheapest offer that passes the bank test.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Offer</TableHead>
              <TableHead className="text-right">Payment now</TableHead>
              <TableHead className="text-right">Payment later</TableHead>
              <TableHead className="text-right">Bank test</TableHead>
              <TableHead className="text-right">Max loan</TableHead>
              <TableHead className="text-right">Total interest</TableHead>
              <TableHead className="text-right">Total cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((r) => (
              <TableRow
                key={r.offer.id}
                data-state={result.best === r ? "selected" : undefined}
              >
                <TableCell className="min-w-44 whitespace-normal">
                  <div className="flex items-center gap-2 font-medium">
                    <SeriesKey index={r.index} />
                    {r.offer.name}
                  </div>
                  <div className="pl-5.5 text-xs text-muted-foreground">
                    {describeOffer(r.offer)}
                  </div>
                </TableCell>
                <NumCell
                  main={eur(r.schedule.firstPayment)}
                  sub={r.offer.type === "fixed" ? "whole term" : "first months"}
                />
                <NumCell
                  main={
                    r.schedule.paymentAfterIntro == null
                      ? "same"
                      : eur(r.schedule.paymentAfterIntro)
                  }
                  sub={
                    r.schedule.paymentAfterIntro == null
                      ? undefined
                      : signedEur(
                          r.schedule.paymentAfterIntro - r.schedule.firstPayment
                        )
                  }
                />
                <NumCell
                  main={<PassBadge r={r} />}
                  sub={`tested at ${eur(r.stressedPayment)}`}
                />
                <NumCell
                  main={eur(r.maxLoan)}
                  sub={
                    r.maxLoan >= result.loan
                      ? "enough"
                      : `short ${eur(result.loan - r.maxLoan)}`
                  }
                />
                <NumCell main={eur(r.totalInterest)} sub="incl. stamp duty" />
                <NumCell
                  main={eur(r.totalCost)}
                  sub={`${eur(r.totalCost / result.months)} / month avg`}
                />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Payment later: after the promo or fixed period, at today's Euribor plus
        the expected change. Bank test: the stressed payment plus other debts as
        a share of income. Total cost: every payment, 4% stamp duty on interest,
        insurance, bank fees and 0.6% stamp duty on the loan.
      </CardFooter>
    </Card>
  )
}

export function CashAtSigning({
  result,
  scenario,
}: {
  result: ScenarioResult
  scenario: Scenario
}) {
  const rows: [string, number][] = [
    ["Down payment", scenario.property.downPayment],
    ["IMT", result.imt],
    ["Stamp duty on purchase (0.8%)", result.stampDutyPurchase],
    ["Stamp duty on loan (0.6%)", result.stampDutyLoan],
    [
      `Bank fees${result.best ? ` (${result.best.offer.name})` : ""}`,
      result.best?.offer.feesOneOff ?? 0,
    ],
    ["Other closing costs", scenario.property.otherClosingCosts],
  ]
  const note = result.youthEligible
    ? scenario.property.price > YOUTH_TAX_EXEMPTION.fullUpTo
      ? `The under-35 exemption covers the first ${eur(YOUTH_TAX_EXEMPTION.fullUpTo)}. Tax applies only to the part above that.`
      : "Fully exempt from IMT and purchase stamp duty under the under-35 rule."
    : "Standard 2026 own-home IMT table. Keep a reserve on top of this for moving and furniture."
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Cash at signing</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-sm tabular-nums">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-right font-medium">{eur(value)}</dd>
            </div>
          ))}
        </dl>
        <Separator />
        <div className="flex justify-between text-sm font-semibold tabular-nums">
          <span>Total</span>
          <span>{eur(result.cashAtSigning)}</span>
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">{note}</CardFooter>
    </Card>
  )
}
