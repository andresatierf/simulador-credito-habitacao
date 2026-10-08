/** Monthly payment of a fully amortising loan. Negative rates are floored at zero. */
export function monthlyPayment(
  annualRatePct: number,
  months: number,
  principal: number
): number {
  if (months <= 0 || principal <= 0) return 0
  const r = Math.max(annualRatePct, 0) / 1200
  if (r === 0) return principal / months
  return (principal * r) / (1 - (1 + r) ** -months)
}

/** Outstanding balance after `paid` monthly payments of a loan taken at a constant rate. */
export function balanceAfter(
  annualRatePct: number,
  months: number,
  principal: number,
  paid: number
): number {
  const payment = monthlyPayment(annualRatePct, months, principal)
  const r = Math.max(annualRatePct, 0) / 1200
  if (r === 0) return principal - payment * paid
  const growth = (1 + r) ** paid
  return principal * growth - (payment * (growth - 1)) / r
}

/** Months needed to repay `balance` with a fixed `payment` at the given rate. */
export function monthsToRepay(
  annualRatePct: number,
  balance: number,
  payment: number
): number {
  if (balance <= 0) return 0
  const r = Math.max(annualRatePct, 0) / 1200
  if (r === 0) return Math.ceil(balance / payment)
  return Math.ceil(-Math.log(1 - (balance * r) / payment) / Math.log(1 + r))
}
