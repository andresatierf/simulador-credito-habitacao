export type RateType = "fixed" | "variable" | "mixed";
export type EuriborTenor = "6m" | "12m";
export type RepaymentMode = "term" | "payment";

export interface Borrower {
  id: string;
  name: string;
  /** Net amount received per salary payment, in euros. */
  netPerPayment: number;
  /** 12 when holiday and Christmas pay are spread across the year (duodécimos), 14 otherwise. */
  paymentsPerYear: 12 | 14;
  /** Flexible benefits (e.g. Coverflex) per month, in euros. */
  benefitsMonthly: number;
  /** Share of the benefits a bank accepts as income, 0–100. */
  benefitsCountedPct: number;
  /** Expected yearly raise of net pay, in percent. */
  raisePct: number;
  enabled: boolean;
}

export interface Offer {
  id: string;
  name: string;
  type: RateType;
  /** TAN for a fixed offer, or for the fixed period of a mixed offer, in percent. */
  fixedRatePct: number;
  /** Index used by a variable offer, or by the variable phase of a mixed offer. */
  index: EuriborTenor;
  /** Spread over Euribor once any promotion or fixed period ends, in percent. */
  spreadPct: number;
  /** Length of the fixed period of a mixed offer, in years. */
  fixedYears: number;
  /** Promotional spread on a variable offer, in percent. */
  promoSpreadPct: number;
  /** Length of the promotional spread, in years. */
  promoYears: number;
  /** Life and home insurance required by the bank, per month. */
  insuranceMonthly: number;
  /** One-off bank fees (dossier, valuation, formalities). */
  feesOneOff: number;
  /** Early repayment fee while the rate is fixed (fixed offers, fixed period of mixed offers), in percent. Legal max 2%. */
  repaymentFeeFixedPct: number;
  /** Early repayment fee while the rate is variable, in percent. Legal max 0.5%. */
  repaymentFeeVariablePct: number;
  enabled: boolean;
}

export interface RepaymentRule {
  id: string;
  amount: number;
  repeats: boolean;
  /** First (or only) loan year, counted from 1; the repayment is made at the end of that year. */
  fromYear: number;
  /** Last loan year for a repeating rule. */
  untilYear: number;
  /** Interval between repetitions, in years. */
  everyYears: number;
  /** "term" keeps the payment and ends the loan sooner; "payment" keeps the end date and lowers the payment. */
  mode: RepaymentMode;
  enabled: boolean;
}

export interface Property {
  price: number;
  /** Bank valuation; LTV and the guarantee limit use the lower of price and valuation. */
  valuation: number;
  downPayment: number;
  termYears: number;
  /** Every buyer is 35 or under (State guarantee, IMT and stamp duty exemption). */
  allBuyersUnder35: boolean;
  /** First home, own permanent residence, no buyer owns a home. */
  firstHome: boolean;
  /** Valuation, deed and registration costs paid in cash. */
  otherClosingCosts: number;
}

export interface Market {
  euribor6mPct: number;
  euribor12mPct: number;
  /** Assumed change in Euribor after today, in percentage points. Moves future payments only. */
  euriborDriftPp: number;
  /** Maximum debt-service-to-income ratio (taxa de esforço), in percent. */
  maxDstiPct: number;
  /** Interest rate shock used in the bank test, in percentage points. */
  stressShockPp: number;
}

export interface Wealth {
  /** Cash, current and savings accounts, term deposits. */
  cash: number;
  /** Funds, shares, PPR and other investments. */
  investments: number;
  /** Outstanding balances of other loans (car, personal credit, cards). */
  debtBalance: number;
}

export interface Scenario {
  borrowers: Borrower[];
  /** Other loan payments per month (car, cards, personal credit). */
  otherDebtMonthly: number;
  property: Property;
  market: Market;
  offers: Offer[];
  repayments: RepaymentRule[];
  /** Payment share of income considered comfortable, used for the switch check. */
  comfortPct: number;
  /** What the household owns and owes before buying. */
  wealth: Wealth;
}
