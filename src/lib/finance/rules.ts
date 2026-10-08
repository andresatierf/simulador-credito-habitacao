/**
 * Legal and regulatory parameters for Portugal (Continente), as of October 2026.
 * Update these when the rules change; every calculation reads from here.
 */

/** Banco de Portugal, Recomendação Macroprudencial 1/2026 (from 1 Aug 2026). */
export const MACROPRUDENTIAL = {
  maxDstiPct: 45,
  /** Interest rate shock by loan term. */
  shockPp: (termYears: number) => (termYears <= 5 ? 0.5 : termYears <= 10 ? 1 : 1.5),
  maxTermYears: (allBuyersUnder35: boolean) => (allBuyersUnder35 ? 40 : 35),
  maxLtvWithoutGuaranteePct: 90,
} as const

/** Decreto-Lei 44/2024: State guarantee for buyers aged 35 or under. */
export const YOUTH_GUARANTEE = {
  maxPropertyValue: 450_000,
  deadline: "2026-12-31",
} as const

/** IMT and stamp duty exemption for buyers aged 35 or under (2026 thresholds). */
export const YOUTH_TAX_EXEMPTION = {
  fullUpTo: 330_539,
  partialUpTo: 660_982,
  /** IMT rate on the part above the full-exemption threshold. */
  imtRateOnExcess: 0.08,
} as const

/** 2026 IMT table for own permanent housing (habitação própria e permanente): [upper bound, rate, deduction]. */
export const IMT_OWN_HOME_2026: ReadonlyArray<readonly [number, number, number]> = [
  [106_346, 0, 0],
  [145_470, 0.02, 2_126.92],
  [198_347, 0.05, 6_491.02],
  [330_539, 0.07, 10_457.96],
  [660_982, 0.08, 13_763.35],
  [1_150_853, 0.06, 0],
  [Number.POSITIVE_INFINITY, 0.075, 0],
]

/** Imposto do Selo. */
export const STAMP_DUTY = {
  purchaseRate: 0.008,
  /** On the loan amount, for terms of 5 years or more. */
  loanRateLongTerm: 0.006,
  loanRateShortTerm: 0.005,
  /** On interest and on bank fees. */
  onInterestRate: 0.04,
} as const

/** Decreto-Lei 74-A/2017: maximum early repayment fee. Banks may charge less or waive it; each offer sets its own. */
export const EARLY_REPAYMENT_FEE_PCT = {
  fixed: 2,
  variable: 0.5,
} as const
