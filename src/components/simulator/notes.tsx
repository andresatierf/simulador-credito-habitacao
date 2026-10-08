import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const SOURCES = [
  [
    "Taxa de esforço rules",
    "https://www.literaciafinanceira.pt/artigos/taxa-de-esforco-maxima",
  ],
  [
    "Youth guarantee and IMT",
    "https://www.literaciafinanceira.pt/artigos/credito-habitacao-jovem",
  ],
  [
    "Youth offers",
    "https://www.rankia.pt/credito-habitacao/credito-habitacao-jovem/",
  ],
  [
    "Fixed rates",
    "https://www.comparamais.pt/credito-habitacao/juros/taxa-fixa/",
  ],
  ["Spreads", "https://www.comparaja.pt/credito-habitacao/artigos/spread"],
  ["Euribor", "https://www.comparaja.pt/credito-habitacao/euribor-hoje"],
] as const

export function Notes() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>How it's calculated</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="ml-4 flex list-disc flex-col gap-1.5 text-sm text-muted-foreground">
          <li>
            Income counted: for each borrower shown, net per payment × payments
            per year ÷ 12, plus the share of their benefits the bank accepts.
          </li>
          <li>
            Bank test: fixed-for-term offers are tested at their own rate.
            Variable offers are tested at Euribor + spread + shock. Mixed offers
            use the higher of the fixed-phase payment and the stressed
            variable-phase payment. Banks differ in the details.
          </li>
          <li>
            Max loan: the largest amount whose stressed payment plus other debts
            fits under the limit.
          </li>
          <li>
            Variable payments are revised when the index resets (6 or 12
            months). After the first reset they use today's Euribor plus the
            expected change.
          </li>
          <li>
            Buyers aged 35 or under (first home): IMT and stamp duty are exempt
            up to €330,539. Between €330,539 and €660,982 they pay 8% IMT and
            0.8% stamp duty on the excess. Otherwise the 2026 own-home (HPP) IMT
            table applies.
          </li>
          <li>
            Early repayments: "Shorten term" keeps the payment and ends the loan
            sooner. "Lower payment" keeps the end date and lowers the payment.
            Insurance is counted until the loan is paid off.
          </li>
          <li>
            Switch check: each borrower's net pay grows by their expected raise
            once a year; counted benefits stay flat. The switch year is the
            first year from which every payment plus other debts stays at or
            below the comfortable share of income, on the cheapest offer that
            passes the bank test.
          </li>
          <li>
            Net worth: cash and investments minus other debts. After buying, the
            home counts at the bank valuation minus the loan; taxes and fees are
            spent, while the down payment becomes equity.
          </li>
          <li>
            Max term under Recomendação 1/2026: 40 years if every buyer is 35 or
            under, otherwise 35.
          </li>
          <li>
            Sources:{" "}
            {SOURCES.map(([label, href], i) => (
              <span key={href}>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {label}
                </a>
                {i < SOURCES.length - 1 ? ", " : "."}
              </span>
            ))}{" "}
            This is a simulator, not a bank proposal.
          </li>
        </ul>
      </CardContent>
    </Card>
  )
}
