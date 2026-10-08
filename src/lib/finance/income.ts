import type { Borrower } from "./types"

function activeBorrowers(borrowers: Borrower[]): Borrower[] {
  return borrowers.filter((b) => b.enabled)
}

/** Monthly income a bank counts: net pay averaged over 12 months plus the accepted share of benefits. */
export function countedIncome(borrowers: Borrower[]): number {
  return projectedIncome(borrowers, 1)
}

/** Counted income in loan year `year` (1-based). Net pay grows by each borrower's raise once a year; benefits stay flat. */
export function projectedIncome(borrowers: Borrower[], year: number): number {
  return activeBorrowers(borrowers).reduce(
    (sum, b) =>
      sum +
      ((b.netPerPayment * b.paymentsPerYear) / 12) * (1 + b.raisePct / 100) ** (year - 1) +
      (b.benefitsMonthly * b.benefitsCountedPct) / 100,
    0,
  )
}
