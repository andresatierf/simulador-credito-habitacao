import { describe, expect, it } from "vitest";

import { defaultScenario, newOffer, newRepayment } from "@/lib/scenario/defaults";

import { monthlyPayment } from "./annuity";
import { comfortableFromYear } from "./comfort";
import { evaluateScenario } from "./evaluate";
import { countedIncome, projectedIncome } from "./income";
import { suggestRepaymentPlan } from "./plan";
import { MACROPRUDENTIAL } from "./rules";
import { buildSchedule } from "./schedule";
import { maxLoanFor, stressedPayment } from "./stress";
import { imtOwnHome, loanStampDuty, purchaseTaxes } from "./taxes";
import type { Market, Scenario } from "./types";

const market: Market = defaultScenario().market;
const LOAN = 350_000;
const MONTHS = 480;
const fixed345 = newOffer("fixed 3.45", { type: "fixed", fixedRatePct: 3.45 });
const variable060 = newOffer("E6M + 0.60", {
  type: "variable",
  spreadPct: 0.6,
  promoSpreadPct: 0.6,
});
const fixed345NoFee = {
  ...fixed345,
  repaymentFeeFixedPct: 0,
  repaymentFeeVariablePct: 0,
};

describe("monthlyPayment", () => {
  it.each([
    [3.45, 1345],
    [4.05, 1474],
    [4.65, 1607],
    [2.5, 1154],
    [2.8, 1213],
  ])("€350k over 40 years at %s%% is about €%i", (rate, expected) => {
    expect(Math.round(monthlyPayment(rate, MONTHS, LOAN))).toBe(expected);
  });

  it("handles a zero rate and an empty loan", () => {
    expect(monthlyPayment(0, 480, 48_000)).toBe(100);
    expect(monthlyPayment(3, 480, 0)).toBe(0);
  });
});

describe("income", () => {
  const { borrowers } = defaultScenario();

  it("averages 14 payments over 12 months", () => {
    expect(countedIncome(borrowers)).toBeCloseTo(3500, 6);
  });

  it("counts the accepted share of benefits, flat over time", () => {
    const withBenefits = borrowers.map((b, i) =>
      i === 0 ? { ...b, benefitsMonthly: 500, benefitsCountedPct: 50 } : b,
    );
    expect(countedIncome(withBenefits) - countedIncome(borrowers)).toBeCloseTo(250, 6);
    expect(projectedIncome(withBenefits, 5) - projectedIncome(borrowers, 5)).toBeCloseTo(250, 6);
  });

  it("grows each borrower's pay by their own raise", () => {
    const raised = borrowers.map((b, i) => ({
      ...b,
      raisePct: i === 0 ? 10 : 0,
    }));
    expect(projectedIncome(raised, 2)).toBeCloseTo(1750 * 1.1 + 1750, 6);
  });

  it("skips hidden borrowers", () => {
    expect(countedIncome(borrowers.map((b, i) => ({ ...b, enabled: i === 0 })))).toBe(1750);
  });
});

describe("bank stress test", () => {
  it("uses the shock for the term", () => {
    expect(MACROPRUDENTIAL.shockPp(5)).toBe(0.5);
    expect(MACROPRUDENTIAL.shockPp(10)).toBe(1);
    expect(MACROPRUDENTIAL.shockPp(40)).toBe(1.5);
  });

  it("tests fixed offers at their own rate", () => {
    expect(Math.round(stressedPayment(fixed345, LOAN, MONTHS, market))).toBe(1345);
  });

  it("adds the shock to Euribor + spread for variable offers", () => {
    expect(Math.round(stressedPayment(variable060, LOAN, MONTHS, market))).toBe(1700);
    const spread080 = newOffer("E6M + 0.80", {
      type: "variable",
      spreadPct: 0.8,
    });
    expect(Math.round(stressedPayment(spread080, LOAN, MONTHS, market))).toBe(1747);
  });

  it("takes the higher of the fixed phase and the stressed variable phase for mixed offers", () => {
    const mixed = newOffer("mixed", {
      type: "mixed",
      fixedRatePct: 2.5,
      fixedYears: 2,
      index: "12m",
      spreadPct: 0.7,
    });
    const stressed = stressedPayment(mixed, LOAN, MONTHS, market);
    expect(stressed).toBeGreaterThan(monthlyPayment(2.5, MONTHS, LOAN));
    expect(stressed).toBeLessThan(monthlyPayment(3.177 + 0.7 + 1.5, MONTHS, LOAN));
  });

  it("finds the largest loan that fits the limit", () => {
    expect(Math.round(maxLoanFor(fixed345, MONTHS, market, 3500 * 0.45))).toBe(409_732);
    expect(Math.round(maxLoanFor(variable060, MONTHS, market, 3500 * 0.45))).toBe(324_222);
  });
});

describe("taxes", () => {
  it("is continuous at the IMT table thresholds", () => {
    expect(imtOwnHome(330_539)).toBeCloseTo(330_539 * 0.08 - 13_763.35, 2);
    expect(imtOwnHome(106_346)).toBe(0);
  });

  it("charges young buyers only on the part above €330,539", () => {
    const taxes = purchaseTaxes(350_000, true);
    expect(taxes.imt).toBeCloseTo(1556.88, 2);
    expect(taxes.stampDutyPurchase).toBeCloseTo(155.69, 2);
    expect(purchaseTaxes(300_000, true).imt).toBe(0);
  });

  it("applies the normal table without the youth exemption or above €660,982", () => {
    expect(purchaseTaxes(350_000, false).imt).toBeCloseTo(14_236.65, 2);
    expect(purchaseTaxes(700_000, true).youthExemptionApplied).toBe(false);
  });

  it("charges 0.6% stamp duty on the loan", () => {
    expect(loanStampDuty(350_000, 40)).toBeCloseTo(2100, 6);
  });
});

describe("schedule with early repayments", () => {
  const base = buildSchedule(fixed345, LOAN, MONTHS, market);

  it("pays off on time without repayments", () => {
    expect(base.paidOffMonths).toBe(MONTHS);
    expect(Math.round(base.interest)).toBe(295_789);
  });

  it("€10k after year 1, shorten term: 27 months sooner, ~€26.6k less interest", () => {
    const s = buildSchedule(fixed345NoFee, LOAN, MONTHS, market, {
      repayments: [newRepayment({ amount: 10_000, fromYear: 1, mode: "term" })],
    });
    expect(MONTHS - s.paidOffMonths).toBe(27);
    expect(Math.round(base.interest - s.interest)).toBe(26_607);
  });

  it("€10k after year 1, lower payment: €1,306/month, ~€8.2k less interest", () => {
    const s = buildSchedule(fixed345NoFee, LOAN, MONTHS, market, {
      repayments: [newRepayment({ amount: 10_000, fromYear: 1, mode: "payment" })],
    });
    expect(s.paidOffMonths).toBe(MONTHS);
    expect(Math.round(s.paymentAfterRepayments ?? 0)).toBe(1306);
    expect(Math.round(base.interest - s.interest)).toBe(8205);
  });

  it("repeats every N years within the range", () => {
    const s = buildSchedule(fixed345NoFee, LOAN, MONTHS, market, {
      repayments: [
        newRepayment({
          amount: 10_000,
          repeats: true,
          everyYears: 5,
          fromYear: 5,
          untilYear: 40,
        }),
      ],
    });
    expect(s.extraPaid).toBe(60_000);
  });

  it("charges 2% while fixed and 0.5% while variable, plus 4% stamp duty", () => {
    const rule = [newRepayment({ amount: 10_000, fromYear: 1 })];
    expect(buildSchedule(fixed345, LOAN, MONTHS, market, { repayments: rule }).repaymentFees).toBeCloseTo(208, 6);
    expect(buildSchedule(variable060, LOAN, MONTHS, market, { repayments: rule }).repaymentFees).toBeCloseTo(52, 6);
    const mixed = newOffer("mixed", {
      type: "mixed",
      fixedRatePct: 2.8,
      fixedYears: 4,
    });
    const late = [newRepayment({ amount: 10_000, fromYear: 5 })];
    expect(buildSchedule(mixed, LOAN, MONTHS, market, { repayments: late }).repaymentFees).toBeCloseTo(52, 6);
  });

  it("uses each offer's own fee, including a waived one", () => {
    const rule = [newRepayment({ amount: 10_000, fromYear: 1 })];
    const lower = { ...fixed345, repaymentFeeFixedPct: 1 };
    expect(buildSchedule(lower, LOAN, MONTHS, market, { repayments: rule }).repaymentFees).toBeCloseTo(104, 6);
    expect(buildSchedule(fixed345NoFee, LOAN, MONTHS, market, { repayments: rule }).repaymentFees).toBe(0);
  });

  it("ignores hidden repayments", () => {
    const s = buildSchedule(fixed345, LOAN, MONTHS, market, {
      repayments: [newRepayment({ amount: 10_000, enabled: false })],
    });
    expect(s.paidOffMonths).toBe(MONTHS);
  });
});

describe("evaluateScenario", () => {
  const result = evaluateScenario(defaultScenario());
  const byName = (name: string) => result.offers.find((r) => r.offer.name === name)!;

  it("counts €3,500/month and allows €1,575", () => {
    expect(result.income).toBeCloseTo(3500, 6);
    expect(result.maxPayment).toBeCloseTo(1575, 6);
  });

  it("passes the fixed offers and fails the variable ones", () => {
    expect(byName("Bankinter · fixed").passes).toBe(true);
    expect(byName("BPI · fixed").dstiPct).toBeCloseTo(42.11, 2);
    expect(byName("BPI · fixed").passes).toBe(true);
    expect(byName("BPI · variable").passes).toBe(false);
    expect(result.best?.offer.name).toBe("Bankinter · fixed");
  });

  it("flags the State guarantee as needed for 100% financing", () => {
    expect(result.ltvPct).toBe(100);
    expect(result.needsGuarantee).toBe(true);
    expect(result.guaranteeEligible).toBe(true);
  });

  it("finds the switch year with the default repayment plan", () => {
    // Year 5 payment ≈ €1,309 ≤ 35% of €3,500 × 1.02⁴ ≈ €1,326; year 4 (≈ €1,321 vs €1,300) is not.
    expect(byName("Bankinter · fixed").withRepayments.comfortableFromYear).toBe(5);
    expect(byName("BPI · variable").withRepayments.comfortableFromYear).toBe(6);
  });

  it("never reaches a low comfortable share without raises", () => {
    const scenario: Scenario = defaultScenario();
    scenario.borrowers = scenario.borrowers.map((b) => ({ ...b, raisePct: 0 }));
    scenario.comfortPct = 25;
    const flat = evaluateScenario(scenario);
    expect(flat.offers[0].withRepayments.comfortableFromYear).toBeNull();
  });

  it("sums planned repayments within the term", () => {
    expect(result.plannedRepayments).toBe(4 * 3000 + 35 * 5000);
  });
});

describe("suggestRepaymentPlan", () => {
  const scenario = defaultScenario();
  const fixed = scenario.offers[0];
  const comfortableFrom = (plan: ReturnType<typeof suggestRepaymentPlan>) =>
    comfortableFromYear(plan!.schedule, scenario.borrowers, scenario.comfortPct, scenario.otherDebtMonthly);

  it("lowers the payment until it is comfortable, then shortens the term", () => {
    const plan = suggestRepaymentPlan(scenario, fixed, 5000, 2)!;
    expect(plan.switchYear).not.toBeNull();
    const [lower, shorten] = plan.rules;
    expect(lower).toMatchObject({
      mode: "payment",
      fromYear: 2,
      untilYear: plan.switchYear! - 1,
    });
    expect(shorten).toMatchObject({
      mode: "term",
      fromYear: plan.switchYear,
      untilYear: 40,
    });
    expect(comfortableFrom(plan)).toBeLessThanOrEqual(plan.switchYear!);
  });

  it("picks the earliest switch that keeps the payment comfortable", () => {
    const plan = suggestRepaymentPlan(scenario, fixed, 5000, 2)!;
    const earlier = buildSchedule(fixed, 350_000, 480, scenario.market, {
      repayments: [
        newRepayment({
          amount: 5000,
          repeats: true,
          fromYear: 2,
          untilYear: plan.switchYear! - 2,
          mode: "payment",
        }),
        newRepayment({
          amount: 5000,
          repeats: true,
          fromYear: plan.switchYear! - 1,
          untilYear: 40,
          mode: "term",
        }),
      ],
    });
    const earlierComfortable = comfortableFromYear(earlier, scenario.borrowers, scenario.comfortPct, 0);
    expect(earlierComfortable == null || earlierComfortable > plan.switchYear! - 1).toBe(true);
  });

  it("shortens the term from the start when the payment is already comfortable", () => {
    const plan = suggestRepaymentPlan({ ...scenario, comfortPct: 45 }, fixed, 5000, 1)!;
    expect(plan.switchYear).toBe(1);
    expect(plan.rules).toHaveLength(1);
    expect(plan.rules[0]).toMatchObject({
      mode: "term",
      fromYear: 1,
      untilYear: 40,
    });
  });

  it("only lowers the payment when it never becomes comfortable", () => {
    const flat = {
      ...scenario,
      comfortPct: 10,
      borrowers: scenario.borrowers.map((b) => ({ ...b, raisePct: 0 })),
    };
    const plan = suggestRepaymentPlan(flat, fixed, 500, 2)!;
    expect(plan.switchYear).toBeNull();
    expect(plan.rules).toEqual([expect.objectContaining({ mode: "payment", fromYear: 2, untilYear: 40 })]);
  });

  it("returns nothing without an amount or outside the term", () => {
    expect(suggestRepaymentPlan(scenario, fixed, 0, 2)).toBeNull();
    expect(suggestRepaymentPlan(scenario, fixed, 5000, 41)).toBeNull();
  });
});

describe("net worth at the start", () => {
  // Defaults: €20,000 cash; €350k bought at valuation, 100% financed.
  // Due at signing: IMT €1,556.88 + purchase stamp duty €155.69 + loan stamp duty €2,100 + bank fees €1,000 + other €800.
  const due = 1556.88 + 155.69 + 2100 + 1000 + 800;

  it("keeps what's left after signing and how long it lasts", () => {
    const { wealth } = evaluateScenario(defaultScenario());
    expect(wealth.netWorthBefore).toBe(20_000);
    expect(wealth.purchaseCosts).toBeCloseTo(due, 1);
    expect(wealth.cashAfterSigning).toBeCloseTo(20_000 - due, 1);
    // Bankinter fixed: €1,345 payment + €60 insurance a month.
    expect(wealth.reserveMonths).toBeCloseTo((20_000 - due) / (monthlyPayment(3.45, 480, 350_000) + 60), 4);
  });

  it("lowers net worth by the purchase costs, not by the down payment", () => {
    const scenario = defaultScenario();
    scenario.wealth = { cash: 80_000, investments: 10_000, debtBalance: 5_000 };
    scenario.property.downPayment = 50_000;
    const { wealth, cashAtSigning } = evaluateScenario(scenario);
    expect(wealth.netWorthBefore).toBe(85_000);
    expect(wealth.cashAfterSigning).toBeCloseTo(80_000 - cashAtSigning, 6);
    expect(wealth.netWorthAfter).toBeCloseTo(85_000 - wealth.purchaseCosts, 6);
  });

  it("counts a valuation above the price as equity", () => {
    const scenario = defaultScenario();
    scenario.property.valuation = 360_000;
    const { wealth } = evaluateScenario(scenario);
    expect(wealth.netWorthAfter).toBeCloseTo(wealth.netWorthBefore - wealth.purchaseCosts + 10_000, 6);
  });

  it("shows a shortfall when savings don't cover the cash due", () => {
    const scenario = defaultScenario();
    scenario.wealth.cash = 2_000;
    const { wealth } = evaluateScenario(scenario);
    expect(wealth.cashAfterSigning).toBeLessThan(0);
    expect(wealth.reserveMonths).toBe(0);
  });
});

/** A scenario as saved before offers had their own repayment fees. */
function legacyScenario(waived: boolean): Record<string, unknown> {
  const s = defaultScenario() as unknown as Record<string, unknown>;
  s.offers = (s.offers as Array<Record<string, unknown>>).map((o) => {
    const copy = { ...o };
    delete copy.repaymentFeeFixedPct;
    delete copy.repaymentFeeVariablePct;
    return copy;
  });
  s.repaymentFeeWaived = waived;
  return s;
}

describe("scenario links and saved data", () => {
  it("gives offers from before per-offer fees the legal maximum, or 0% when the fee was waived", async () => {
    const { parseScenario } = await import("@/lib/scenario/codec");
    const charged = parseScenario(legacyScenario(false))!;
    expect(charged.offers[0]).toMatchObject({
      repaymentFeeFixedPct: 2,
      repaymentFeeVariablePct: 0.5,
    });
    const waived = parseScenario(legacyScenario(true))!;
    expect(waived.offers[0]).toMatchObject({
      repaymentFeeFixedPct: 0,
      repaymentFeeVariablePct: 0,
    });
  });
});
