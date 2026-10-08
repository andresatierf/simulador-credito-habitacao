import { monthlyPayment, monthsToRepay } from "./annuity";
import { STAMP_DUTY } from "./rules";
import type { Market, Offer, RepaymentRule } from "./types";

const EPSILON = 0.005;

export interface Schedule {
  /** Payment for each month of the original term; zero after the loan is paid off. */
  payments: number[];
  /** Interest paid, before stamp duty. */
  interest: number;
  /** Number of months with a payment. */
  paidOffMonths: number;
  /** Early repayment fees, including stamp duty on the fee. */
  repaymentFees: number;
  /** Total extra principal repaid early. */
  extraPaid: number;
  firstPayment: number;
  /** Payment once the promotion or fixed period ends; null for fixed offers. */
  paymentAfterIntro: number | null;
  /** Payment right after the last early repayment; null when there was none. */
  paymentAfterRepayments: number | null;
}

export function indexRatePct(offer: Pick<Offer, "index">, market: Market): number {
  return offer.index === "12m" ? market.euribor12mPct : market.euribor6mPct;
}

function resetMonths(offer: Offer): number {
  return offer.index === "12m" ? 12 : 6;
}

/** Nominal rate (TAN) applied in month `m` (0-based). Euribor stays at today's value until the first reset, then moves by the drift. */
export function rateAt(offer: Offer, market: Market, m: number): number {
  const today = indexRatePct(offer, market);
  const later = today + market.euriborDriftPp;
  if (offer.type === "fixed") return offer.fixedRatePct;
  if (offer.type === "mixed") {
    return m < Math.round(offer.fixedYears * 12) ? offer.fixedRatePct : later + offer.spreadPct;
  }
  const index = m < resetMonths(offer) ? today : later;
  const spread = m < Math.round(offer.promoYears * 12) ? offer.promoSpreadPct : offer.spreadPct;
  return index + spread;
}

function isFixedAt(offer: Offer, m: number): boolean {
  if (offer.type === "fixed") return true;
  if (offer.type === "mixed") return m < Math.round(offer.fixedYears * 12);
  return false;
}

/** Whether a repayment rule applies at the end of loan year `year` (1-based). */
export function ruleDueInYear(rule: RepaymentRule, year: number): boolean {
  if (!rule.enabled || !(rule.amount > 0)) return false;
  if (!rule.repeats) return year === rule.fromYear;
  const every = Math.max(1, Math.round(rule.everyYears || 1));
  return year >= rule.fromYear && year <= rule.untilYear && (year - rule.fromYear) % every === 0;
}

export interface ScheduleOptions {
  repayments?: RepaymentRule[];
}

/**
 * Month-by-month schedule. The annuity is recalculated whenever the rate changes, and after each early repayment.
 * Early repayments happen at the end of a loan year and are applied in list order.
 */
export function buildSchedule(
  offer: Offer,
  principal: number,
  months: number,
  market: Market,
  options: ScheduleOptions = {},
): Schedule {
  const rules = options.repayments ?? [];
  const payments = Array.from({ length: months }, () => 0);
  let balance = principal;
  let currentRate: number | null = null;
  let payment = 0;
  let interest = 0;
  let end = months;
  let repaymentFees = 0;
  let extraPaid = 0;
  let paidOffMonths = 0;
  let lastRepaymentMonth = -1;

  for (let m = 0; m < months && balance > EPSILON; m++) {
    const rate = Math.max(rateAt(offer, market, m), 0);
    if (rate !== currentRate) {
      currentRate = rate;
      payment = monthlyPayment(rate, end - m, balance);
    }
    const monthInterest = (balance * rate) / 1200;
    interest += monthInterest;
    const paid = Math.min(payment, balance + monthInterest);
    balance = balance + monthInterest - paid;
    payments[m] = paid;
    paidOffMonths = m + 1;

    if ((m + 1) % 12 !== 0 || rules.length === 0) continue;
    const year = (m + 1) / 12;
    for (const rule of rules) {
      if (balance <= EPSILON || !ruleDueInYear(rule, year)) continue;
      const extra = Math.min(rule.amount, balance);
      balance -= extra;
      extraPaid += extra;
      lastRepaymentMonth = m;
      const feePct = isFixedAt(offer, m) ? offer.repaymentFeeFixedPct : offer.repaymentFeeVariablePct;
      repaymentFees += ((extra * feePct) / 100) * (1 + STAMP_DUTY.onInterestRate);
      if (balance <= EPSILON) break;
      if (rule.mode === "term") {
        end = Math.min(m + 1 + monthsToRepay(rate, balance, payment), months);
      }
      payment = monthlyPayment(rate, end - m - 1, balance);
    }
  }

  const introEnd =
    offer.type === "fixed"
      ? null
      : offer.type === "mixed"
        ? Math.round(offer.fixedYears * 12)
        : Math.max(Math.round(offer.promoYears * 12), resetMonths(offer));

  return {
    payments,
    interest,
    paidOffMonths,
    repaymentFees,
    extraPaid,
    firstPayment: payments[0] ?? 0,
    paymentAfterIntro: introEnd != null && introEnd < paidOffMonths ? payments[introEnd] : null,
    paymentAfterRepayments:
      lastRepaymentMonth >= 0 && lastRepaymentMonth + 1 < paidOffMonths ? payments[lastRepaymentMonth + 1] : null,
  };
}

export function totalPaid(schedule: Schedule): number {
  return schedule.payments.reduce((sum, p) => sum + p, 0);
}
