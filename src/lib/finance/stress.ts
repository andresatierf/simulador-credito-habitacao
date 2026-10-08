import { balanceAfter, monthlyPayment } from "./annuity"
import { indexRatePct } from "./schedule"
import type { Market, Offer } from "./types"

/**
 * Payment the bank uses for the affordability test.
 * Fixed-for-term offers are tested at their own rate. Variable offers are tested at Euribor + spread + shock.
 * Mixed offers use the higher of the fixed-phase payment and the stressed payment for the variable phase.
 */
export function stressedPayment(offer: Offer, principal: number, months: number, market: Market): number {
  if (offer.type === "fixed") return monthlyPayment(offer.fixedRatePct, months, principal)
  const stressedRate = indexRatePct(offer, market) + offer.spreadPct + market.stressShockPp
  if (offer.type === "variable") return monthlyPayment(stressedRate, months, principal)

  const fixedMonths = Math.min(Math.round(offer.fixedYears * 12), months)
  const fixedPhase = monthlyPayment(offer.fixedRatePct, months, principal)
  if (fixedMonths >= months) return fixedPhase
  const balance = balanceAfter(offer.fixedRatePct, months, principal, fixedMonths)
  return Math.max(fixedPhase, monthlyPayment(stressedRate, months - fixedMonths, balance))
}

/** Largest loan whose stressed payment plus other debts fits under `maxPayment`. Payments scale linearly with principal. */
export function maxLoanFor(offer: Offer, months: number, market: Market, maxPayment: number): number {
  const perEuro = stressedPayment(offer, 1_000, months, market) / 1_000
  return perEuro > 0 ? Math.max(maxPayment, 0) / perEuro : 0
}
