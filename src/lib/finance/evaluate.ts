import { comfortableFromYear } from "./comfort"
import { countedIncome } from "./income"
import { MACROPRUDENTIAL, STAMP_DUTY, YOUTH_GUARANTEE } from "./rules"
import { buildSchedule, totalPaid, type Schedule } from "./schedule"
import { maxLoanFor, stressedPayment } from "./stress"
import { loanStampDuty, purchaseTaxes } from "./taxes"
import type { Offer, Scenario } from "./types"

export interface OfferResult {
  offer: Offer
  /** Index in `scenario.offers`, used for a stable color. */
  index: number
  schedule: Schedule
  stressedPayment: number
  /** Stressed payment plus other debts, as a share of counted income. */
  dstiPct: number
  passes: boolean
  maxLoan: number
  /** Interest including 4% stamp duty. */
  totalInterest: number
  /** Every payment, stamp duty on interest, insurance, bank fees and loan stamp duty. */
  totalCost: number
  withRepayments: {
    schedule: Schedule
    /** Interest saved after repayment fees, compared with no repayments. */
    interestSaved: number
    /** Total cost including the extra money put in. */
    totalCost: number
    comfortableFromYear: number | null
  }
}

export interface ScenarioResult {
  income: number
  /** Most the bank allows for this loan's payment, after other debts. */
  maxPayment: number
  loan: number
  months: number
  ltvPct: number
  youthEligible: boolean
  guaranteeEligible: boolean
  needsGuarantee: boolean
  maxTermYears: number
  imt: number
  stampDutyPurchase: number
  stampDutyLoan: number
  offers: OfferResult[]
  /** Cheapest shown offer that passes the bank test. */
  best: OfferResult | null
  /** Shown offer with the lowest payment that passes the bank test. */
  lowestPayment: OfferResult | null
  /** Cheapest shown offer once early repayments are included. */
  bestWithRepayments: OfferResult | null
  /** Cash needed at signing, using the bank fees of the best offer. */
  cashAtSigning: number
  plannedRepayments: number
}

function costOf(schedule: Schedule, offer: Offer, loanStamp: number, insuredMonths: number): number {
  return (
    totalPaid(schedule) +
    schedule.interest * STAMP_DUTY.onInterestRate +
    offer.insuranceMonthly * insuredMonths +
    offer.feesOneOff +
    loanStamp
  )
}

export function plannedRepaymentTotal(scenario: Scenario, years: number): number {
  let total = 0
  for (const rule of scenario.repayments) {
    if (!rule.enabled || !(rule.amount > 0)) continue
    if (!rule.repeats) {
      if (rule.fromYear >= 1 && rule.fromYear <= years) total += rule.amount
      continue
    }
    const every = Math.max(1, Math.round(rule.everyYears || 1))
    for (let y = Math.max(rule.fromYear, 1); y <= Math.min(rule.untilYear, years); y += every) total += rule.amount
  }
  return total
}

export function evaluateScenario(scenario: Scenario): ScenarioResult {
  const { property, market, borrowers, otherDebtMonthly } = scenario
  const income = countedIncome(borrowers)
  const maxPayment = Math.max((income * market.maxDstiPct) / 100 - otherDebtMonthly, 0)
  const loan = Math.max(property.price - property.downPayment, 0)
  const months = Math.round(Math.max(property.termYears, 1) * 12)
  const ltvBase = Math.min(property.price, property.valuation || property.price)
  const ltvPct = ltvBase > 0 ? (loan / ltvBase) * 100 : 0
  const youthEligible = property.allBuyersUnder35 && property.firstHome
  const guaranteeEligible = youthEligible && ltvBase <= YOUTH_GUARANTEE.maxPropertyValue
  const taxes = purchaseTaxes(property.price, youthEligible)
  const stampDutyLoan = loanStampDuty(loan, property.termYears)

  const offers = scenario.offers.map((offer, index): OfferResult => {
    const schedule = buildSchedule(offer, loan, months, market)
    const stressed = stressedPayment(offer, loan, months, market)
    const dstiPct = income > 0 ? ((stressed + otherDebtMonthly) / income) * 100 : Number.POSITIVE_INFINITY
    const withRepaymentsSchedule = buildSchedule(offer, loan, months, market, {
      repayments: scenario.repayments,
      repaymentFeeWaived: scenario.repaymentFeeWaived,
    })
    const stampedInterest = 1 + STAMP_DUTY.onInterestRate
    return {
      offer,
      index,
      schedule,
      stressedPayment: stressed,
      dstiPct,
      passes: dstiPct <= market.maxDstiPct + 1e-9,
      maxLoan: maxLoanFor(offer, months, market, maxPayment),
      totalInterest: schedule.interest * stampedInterest,
      totalCost: costOf(schedule, offer, stampDutyLoan, months),
      withRepayments: {
        schedule: withRepaymentsSchedule,
        interestSaved:
          (schedule.interest - withRepaymentsSchedule.interest) * stampedInterest - withRepaymentsSchedule.repaymentFees,
        totalCost:
          costOf(withRepaymentsSchedule, offer, stampDutyLoan, withRepaymentsSchedule.paidOffMonths) +
          withRepaymentsSchedule.extraPaid +
          withRepaymentsSchedule.repaymentFees,
        comfortableFromYear: comfortableFromYear(
          withRepaymentsSchedule,
          borrowers,
          scenario.comfortPct,
          otherDebtMonthly,
        ),
      },
    }
  })

  const shown = offers.filter((r) => r.offer.enabled)
  const passing = shown.filter((r) => r.passes)
  const best = [...passing].sort((a, b) => a.totalCost - b.totalCost)[0] ?? null
  const lowestPayment = [...passing].sort((a, b) => a.stressedPayment - b.stressedPayment)[0] ?? null
  const bestWithRepayments =
    [...shown].sort((a, b) => a.withRepayments.totalCost - b.withRepayments.totalCost)[0] ?? null

  const cashAtSigning =
    property.downPayment +
    taxes.imt +
    taxes.stampDutyPurchase +
    stampDutyLoan +
    (best?.offer.feesOneOff ?? 0) +
    property.otherClosingCosts

  return {
    income,
    maxPayment,
    loan,
    months,
    ltvPct,
    youthEligible,
    guaranteeEligible,
    needsGuarantee: ltvPct > MACROPRUDENTIAL.maxLtvWithoutGuaranteePct,
    maxTermYears: MACROPRUDENTIAL.maxTermYears(property.allBuyersUnder35),
    imt: taxes.imt,
    stampDutyPurchase: taxes.stampDutyPurchase,
    stampDutyLoan,
    offers,
    best,
    lowestPayment,
    bestWithRepayments,
    cashAtSigning,
    plannedRepayments: plannedRepaymentTotal(scenario, Math.floor(months / 12)),
  }
}
