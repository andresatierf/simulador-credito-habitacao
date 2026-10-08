import { IMT_OWN_HOME_2026, STAMP_DUTY, YOUTH_TAX_EXEMPTION } from "./rules";

/** IMT on own permanent housing, using the 2026 table. */
export function imtOwnHome(value: number): number {
  for (const [upTo, rate, deduction] of IMT_OWN_HOME_2026) {
    if (value <= upTo) return Math.max(value * rate - deduction, 0);
  }
  return 0;
}

export interface PurchaseTaxes {
  imt: number;
  stampDutyPurchase: number;
  youthExemptionApplied: boolean;
}

/**
 * IMT and stamp duty on the purchase. Buyers aged 35 or under buying a first home are exempt up to the first threshold;
 * between the thresholds they pay 8% IMT and 0.8% stamp duty on the excess only; above the second threshold no exemption applies.
 */
export function purchaseTaxes(price: number, youthEligible: boolean): PurchaseTaxes {
  if (youthEligible && price <= YOUTH_TAX_EXEMPTION.partialUpTo) {
    const excess = Math.max(price - YOUTH_TAX_EXEMPTION.fullUpTo, 0);
    return {
      imt: excess * YOUTH_TAX_EXEMPTION.imtRateOnExcess,
      stampDutyPurchase: excess * STAMP_DUTY.purchaseRate,
      youthExemptionApplied: true,
    };
  }
  return {
    imt: imtOwnHome(price),
    stampDutyPurchase: price * STAMP_DUTY.purchaseRate,
    youthExemptionApplied: false,
  };
}

export function loanStampDuty(loan: number, termYears: number): number {
  return loan * (termYears >= 5 ? STAMP_DUTY.loanRateLongTerm : STAMP_DUTY.loanRateShortTerm);
}
