import { comfortableFromYear } from "./comfort"
import { buildSchedule, type Schedule } from "./schedule"
import type { Offer, RepaymentRule, Scenario } from "./types"

export type PlannedRule = Omit<RepaymentRule, "id">

export interface RepaymentPlan {
  rules: PlannedRule[]
  /** First year repayments shorten the term; null when the plan only lowers the payment. */
  switchYear: number | null
  schedule: Schedule
}

function rulesFor(amount: number, fromYear: number, switchYear: number, lastYear: number): PlannedRule[] {
  const base = { amount, repeats: true, everyYears: 1, enabled: true }
  const rules: PlannedRule[] = []
  if (switchYear > fromYear) {
    rules.push({ ...base, fromYear, untilYear: Math.min(switchYear - 1, lastYear), mode: "payment" })
  }
  if (switchYear <= lastYear) {
    rules.push({ ...base, fromYear: Math.max(switchYear, fromYear), untilYear: lastYear, mode: "term" })
  }
  return rules
}

/**
 * Yearly repayments of `amount` from `fromYear`: lower the payment while it is above the comfortable share of
 * projected income, then shorten the term from the first year the payment stays comfortable. Shortening the term
 * always saves more interest, so the earliest switch that keeps the payment comfortable is the cheapest plan.
 */
export function suggestRepaymentPlan(
  scenario: Scenario,
  offer: Offer,
  amount: number,
  fromYear: number,
): RepaymentPlan | null {
  const loan = Math.max(scenario.property.price - scenario.property.downPayment, 0)
  const months = Math.round(Math.max(scenario.property.termYears, 1) * 12)
  const lastYear = Math.floor(months / 12)
  if (!(amount > 0) || loan <= 0 || fromYear < 1 || fromYear > lastYear) return null

  const scheduleFor = (rules: PlannedRule[]) =>
    buildSchedule(offer, loan, months, scenario.market, {
      repayments: rules.map((r, i) => ({ ...r, id: String(i) })),
    })

  for (let switchYear = fromYear; switchYear <= lastYear; switchYear++) {
    const rules = rulesFor(amount, fromYear, switchYear, lastYear)
    const schedule = scheduleFor(rules)
    const comfortable = comfortableFromYear(schedule, scenario.borrowers, scenario.comfortPct, scenario.otherDebtMonthly)
    if (comfortable != null && comfortable <= switchYear) return { rules, switchYear, schedule }
  }

  const rules = rulesFor(amount, fromYear, lastYear + 1, lastYear)
  return { rules, switchYear: null, schedule: scheduleFor(rules) }
}
