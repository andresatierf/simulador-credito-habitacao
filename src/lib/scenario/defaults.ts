import { EARLY_REPAYMENT_FEE_PCT } from "@/lib/finance/rules";
import type { Borrower, Offer, RepaymentRule, Scenario } from "@/lib/finance/types";

export function newId(): string {
  return crypto.randomUUID();
}

export function newBorrower(name: string, overrides: Partial<Borrower> = {}): Borrower {
  return {
    id: newId(),
    name,
    netPerPayment: 1000,
    paymentsPerYear: 14,
    benefitsMonthly: 0,
    benefitsCountedPct: 0,
    raisePct: 2,
    enabled: true,
    ...overrides,
  };
}

export function newOffer(name: string, overrides: Partial<Offer> = {}): Offer {
  return {
    id: newId(),
    name,
    type: "fixed",
    fixedRatePct: 3.5,
    index: "6m",
    spreadPct: 0.8,
    fixedYears: 5,
    promoSpreadPct: 0.8,
    promoYears: 0,
    insuranceMonthly: 60,
    feesOneOff: 1000,
    repaymentFeeFixedPct: EARLY_REPAYMENT_FEE_PCT.fixed,
    repaymentFeeVariablePct: EARLY_REPAYMENT_FEE_PCT.variable,
    enabled: true,
    ...overrides,
  };
}

export function newRepayment(overrides: Partial<RepaymentRule> = {}): RepaymentRule {
  return {
    id: newId(),
    amount: 5000,
    repeats: false,
    fromYear: 1,
    untilYear: 40,
    everyYears: 1,
    mode: "term",
    enabled: true,
    ...overrides,
  };
}

/**
 * Starting scenario. Offers are indicative public rates from July–August 2026, mostly quoted at 80% LTV;
 * Euribor is from 7 Oct 2026.
 */
export function defaultScenario(): Scenario {
  return {
    borrowers: [
      newBorrower("Borrower 1", { netPerPayment: 1500, paymentsPerYear: 14 }),
      newBorrower("Borrower 2", { netPerPayment: 1500, paymentsPerYear: 14 }),
    ],
    otherDebtMonthly: 0,
    property: {
      price: 350_000,
      valuation: 350_000,
      downPayment: 0,
      termYears: 40,
      allBuyersUnder35: true,
      firstHome: true,
      otherClosingCosts: 800,
    },
    market: {
      euribor6mPct: 2.954,
      euribor12mPct: 3.177,
      euriborDriftPp: 0,
      maxDstiPct: 45,
      stressShockPp: 1.5,
    },
    offers: [
      newOffer("Bankinter · fixed", {
        type: "fixed",
        fixedRatePct: 3.45,
        index: "12m",
        spreadPct: 0.7,
      }),
      newOffer("BPI · fixed", {
        type: "fixed",
        fixedRatePct: 4.05,
        spreadPct: 0.6,
      }),
      newOffer("BPI · variable", {
        type: "variable",
        spreadPct: 0.6,
        promoSpreadPct: 0.6,
        promoYears: 0,
      }),
      newOffer("Santander · variable promo", {
        type: "variable",
        spreadPct: 0.8,
        promoSpreadPct: 0.5,
        promoYears: 3,
      }),
      newOffer("Bankinter · mixed 2y", {
        type: "mixed",
        fixedRatePct: 2.5,
        fixedYears: 2,
        index: "12m",
        spreadPct: 0.7,
      }),
      newOffer("Santander · mixed 4y", {
        type: "mixed",
        fixedRatePct: 2.8,
        fixedYears: 4,
        spreadPct: 0.8,
      }),
    ],
    repayments: [
      newRepayment({
        amount: 3000,
        repeats: true,
        fromYear: 2,
        untilYear: 5,
        mode: "payment",
      }),
      newRepayment({
        amount: 5000,
        repeats: true,
        fromYear: 6,
        untilYear: 40,
        mode: "term",
      }),
    ],
    comfortPct: 35,
    wealth: { cash: 20_000, investments: 0, debtBalance: 0 },
  };
}
