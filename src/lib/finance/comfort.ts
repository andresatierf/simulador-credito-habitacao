import { projectedIncome } from "./income"
import type { Schedule } from "./schedule"
import type { Borrower } from "./types"

/**
 * First loan year from which every monthly payment, plus other debts, stays at or below `comfortPct` of projected income
 * for the rest of the loan. Returns null when that never happens.
 */
export function comfortableFromYear(
  schedule: Schedule,
  borrowers: Borrower[],
  comfortPct: number,
  otherDebtMonthly: number,
): number | null {
  const years = Math.ceil(schedule.paidOffMonths / 12)
  let from: number | null = null
  for (let year = years; year >= 1; year--) {
    let highest = 0
    for (let m = (year - 1) * 12; m < Math.min(year * 12, schedule.paidOffMonths); m++) {
      highest = Math.max(highest, schedule.payments[m])
    }
    if (highest + otherDebtMonthly > (projectedIncome(borrowers, year) * comfortPct) / 100) break
    from = year
  }
  return from
}
