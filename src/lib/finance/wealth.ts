import type { Property, Wealth } from "./types"

export interface WealthResult {
  netWorthBefore: number
  /** Taxes and fees paid at signing; spent, so they lower net worth. The down payment is not included. */
  purchaseCosts: number
  /** Cash left once everything due at signing is paid. Negative when savings don't cover it. */
  cashAfterSigning: number
  /** Home at the bank valuation, minus the loan, plus what's left. */
  netWorthAfter: number
  /** Months of loan payment, insurance and other debt payments the remaining cash covers. */
  reserveMonths: number | null
}

export function wealthAtStart({
  wealth,
  property,
  loan,
  cashAtSigning,
  monthlyOutgoings,
}: {
  wealth: Wealth
  property: Property
  loan: number
  cashAtSigning: number
  monthlyOutgoings: number
}): WealthResult {
  const netWorthBefore = wealth.cash + wealth.investments - wealth.debtBalance
  const purchaseCosts = cashAtSigning - property.downPayment
  const cashAfterSigning = wealth.cash - cashAtSigning
  const homeValue = property.valuation || property.price
  const netWorthAfter = cashAfterSigning + wealth.investments - wealth.debtBalance + homeValue - loan
  return {
    netWorthBefore,
    purchaseCosts,
    cashAfterSigning,
    netWorthAfter,
    reserveMonths: monthlyOutgoings > 0 ? Math.max(cashAfterSigning, 0) / monthlyOutgoings : null,
  }
}
