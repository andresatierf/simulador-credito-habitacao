import { z } from "zod"

const amount = () =>
  z.number({ error: "Enter a number" }).min(0, { error: "Must be 0 or more" })
const between = (min: number, max: number) =>
  z
    .number({ error: "Enter a number" })
    .min(min, { error: `Must be between ${min} and ${max}` })
    .max(max, { error: `Must be between ${min} and ${max}` })
const rate = () => between(-5, 30)
const year = () => between(1, 40)

export const borrowerSchema = z.object({
  id: z.string(),
  name: z.string(),
  netPerPayment: amount(),
  paymentsPerYear: z.union([z.literal(12), z.literal(14)]),
  benefitsMonthly: amount(),
  benefitsCountedPct: between(0, 100),
  raisePct: between(-20, 50),
  enabled: z.boolean(),
})

export const offerSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["fixed", "variable", "mixed"]),
  fixedRatePct: rate(),
  index: z.enum(["6m", "12m"]),
  spreadPct: rate(),
  fixedYears: between(0, 40),
  promoSpreadPct: rate(),
  promoYears: between(0, 40),
  insuranceMonthly: amount(),
  feesOneOff: amount(),
  enabled: z.boolean(),
})

export const repaymentSchema = z
  .object({
    id: z.string(),
    amount: amount(),
    repeats: z.boolean(),
    fromYear: year(),
    untilYear: year(),
    everyYears: year(),
    mode: z.enum(["term", "payment"]),
    enabled: z.boolean(),
  })
  .refine((r) => !r.repeats || r.untilYear >= r.fromYear, {
    error: "Must be the same as or after the first year",
    path: ["untilYear"],
  })

export const scenarioSchema = z.object({
  borrowers: z.array(borrowerSchema).min(1),
  otherDebtMonthly: amount(),
  property: z.object({
    price: amount(),
    valuation: amount(),
    downPayment: amount(),
    termYears: between(5, 40),
    allBuyersUnder35: z.boolean(),
    firstHome: z.boolean(),
    otherClosingCosts: amount(),
  }),
  market: z.object({
    euribor6mPct: rate(),
    euribor12mPct: rate(),
    euriborDriftPp: between(-5, 10),
    maxDstiPct: between(10, 80),
    stressShockPp: between(0, 5),
  }),
  offers: z.array(offerSchema),
  repayments: z.array(repaymentSchema),
  repaymentFeeWaived: z.boolean(),
  comfortPct: between(5, 80),
})

export type ScenarioInput = z.input<typeof scenarioSchema>
