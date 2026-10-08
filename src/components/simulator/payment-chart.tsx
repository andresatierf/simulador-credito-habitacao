import * as React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { eur, pct } from "@/lib/format"
import type { OfferResult, ScenarioResult } from "@/lib/finance/evaluate"
import { projectedIncome } from "@/lib/finance/income"
import type { Borrower } from "@/lib/finance/types"

import { SeriesKey, seriesColor } from "./series"

const MARGIN = { left: 60, right: 14, top: 14, bottom: 30 }

function niceStep(range: number, target: number): number {
  const raw = range / target
  const power = 10 ** Math.floor(Math.log10(raw))
  const m = raw / power
  return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * power
}

/** Stepped SVG path through monthly values; one corner per payment change. */
function stepPath(values: number[], end: number, x: (m: number) => number, y: (v: number) => number): string {
  let d = `M${x(0)},${y(values[0])}`
  for (let m = 1; m < end; m++) {
    if (values[m] !== values[m - 1]) d += `L${x(m)},${y(values[m - 1])}L${x(m)},${y(values[m])}`
  }
  return `${d}L${x(end)},${y(values[end - 1])}`
}

function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = React.useRef<T>(null)
  const [width, setWidth] = React.useState(720)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width]
}

export function PaymentChart({
  result,
  borrowers,
  comfortPct,
  otherDebtMonthly,
  withRepayments,
}: {
  result: ScenarioResult
  borrowers: Borrower[]
  comfortPct: number
  otherDebtMonthly: number
  withRepayments: boolean
}) {
  const [boxRef, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = React.useState<{ month: number; px: number } | null>(null)
  const shown = result.offers.filter((r) => r.offer.enabled)
  const scheduleOf = (r: OfferResult) => (withRepayments ? r.withRepayments.schedule : r.schedule)

  const W = Math.max(width, 300)
  const H = W < 520 ? 260 : 320
  const innerW = W - MARGIN.left - MARGIN.right
  const innerH = H - MARGIN.top - MARGIN.bottom
  const N = result.months
  const limit = result.maxPayment
  const years = Math.ceil(N / 12)
  const comfortAt = (year: number) => Math.max((projectedIncome(borrowers, year) * comfortPct) / 100 - otherDebtMonthly, 0)

  let lo = limit
  let hi = limit
  for (const r of shown) {
    const s = scheduleOf(r)
    for (let m = 0; m < s.paidOffMonths; m++) {
      lo = Math.min(lo, s.payments[m])
      hi = Math.max(hi, s.payments[m])
    }
  }
  // Pad by a small share of the data range (not of the values) so the lines fill the plot.
  const range = Math.max(hi - lo, 100)
  const step = niceStep(range, 5)
  const pad = range * 0.04
  const y0 = Math.max(Math.floor((lo - pad) / step) * step, 0)
  const y1 = Math.ceil((hi + pad) / step) * step
  const x = (m: number) => MARGIN.left + (m / N) * innerW
  const y = (v: number) => MARGIN.top + innerH - ((v - y0) / (y1 - y0)) * innerH
  const yTicks: number[] = []
  for (let v = y0; v <= y1 + 1e-6; v += step) yTicks.push(v)
  const xStep = niceStep(years, W < 520 ? 4 : 8)
  const xTicks: number[] = []
  for (let yr = 0; yr <= years + 1e-6; yr += xStep) xTicks.push(yr)

  let comfortPath = ""
  let lastY = 0
  for (let yr = 1; yr <= years; yr++) {
    const Y = y(comfortAt(yr))
    const X0 = x((yr - 1) * 12)
    const X1 = x(Math.min(yr * 12, N))
    comfortPath += yr === 1 ? `M${X0},${Y}` : `L${X0},${lastY}L${X0},${Y}`
    comfortPath += `L${X1},${Y}`
    lastY = Y
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - rect.left) * W) / rect.width
    const month = Math.max(0, Math.min(N - 1, Math.round(((px - MARGIN.left) / innerW) * N)))
    setHover({ month, px: e.clientX - rect.left })
  }

  const hoverRows =
    hover &&
    shown
      .map((r) => {
        const s = scheduleOf(r)
        return { r, value: hover.month < s.paidOffMonths ? s.payments[hover.month] : null }
      })
      .sort((a, b) => (b.value ?? -1) - (a.value ?? -1))

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Monthly payment over the loan</h2>
        </CardTitle>
        <CardDescription>
          {withRepayments ? "With early repayments. " : ""}Red dashed: the most the bank lets you pay. Blue dotted: your
          comfortable payment as income grows.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {shown.map((r) => (
            <li key={r.offer.id} className="flex items-center gap-1.5">
              <SeriesKey index={r.index} />
              {r.offer.name}
            </li>
          ))}
        </ul>
        <div ref={boxRef} className="relative">
          {shown.length > 0 && result.loan > 0 && (
            <svg
              role="img"
              aria-label="Monthly payment per offer over the term of the loan"
              viewBox={`0 0 ${W} ${H}`}
              width={W}
              height={H}
              className="block h-auto w-full touch-none"
              onPointerMove={onPointerMove}
              onPointerLeave={() => setHover(null)}
            >
              <defs>
                <clipPath id="plot-area">
                  <rect x={MARGIN.left} y={MARGIN.top} width={innerW} height={innerH} />
                </clipPath>
              </defs>
              <g className="fill-muted-foreground text-[11px] tabular-nums">
                {yTicks.map((v) => (
                  <g key={v}>
                    <line x1={MARGIN.left} x2={W - MARGIN.right} y1={y(v)} y2={y(v)} className="stroke-border" />
                    <text x={MARGIN.left - 8} y={y(v) + 4} textAnchor="end">
                      {eur(v)}
                    </text>
                  </g>
                ))}
                {xTicks.map((yr) => (
                  <text key={yr} x={x(yr * 12)} y={H - 8} textAnchor={yr === 0 ? "start" : "middle"}>
                    {yr === 0 ? "Year 0" : yr}
                  </text>
                ))}
              </g>
              {limit > 0 && (
                <g>
                  <line
                    x1={MARGIN.left}
                    x2={W - MARGIN.right}
                    y1={y(limit)}
                    y2={y(limit)}
                    className="stroke-destructive"
                    strokeWidth={1.5}
                    strokeDasharray="5 4"
                  />
                  <text x={W - MARGIN.right} y={y(limit) - 6} textAnchor="end" className="fill-muted-foreground text-[11px]">
                    Bank limit {eur(limit)}
                  </text>
                </g>
              )}
              <path
                d={comfortPath}
                fill="none"
                className="stroke-primary"
                strokeWidth={1.5}
                strokeDasharray="2 4"
                strokeLinecap="round"
                clipPath="url(#plot-area)"
              />
              {shown.map((r) => {
                const s = scheduleOf(r)
                const end = Math.max(s.paidOffMonths, 1)
                return (
                  <g key={r.offer.id}>
                    <path
                      d={stepPath(s.payments, end, x, y)}
                      fill="none"
                      stroke={seriesColor(r.index)}
                      strokeWidth={2}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    {end < N && (
                      <circle cx={x(end)} cy={y(s.payments[end - 1])} r={4} fill={seriesColor(r.index)} className="stroke-card" strokeWidth={2} />
                    )}
                  </g>
                )
              })}
              {hover && (
                <g pointerEvents="none">
                  <line x1={x(hover.month)} x2={x(hover.month)} y1={MARGIN.top} y2={MARGIN.top + innerH} className="stroke-muted-foreground" opacity={0.6} />
                  {hoverRows?.map(({ r, value }) =>
                    value == null ? null : (
                      <circle key={r.offer.id} cx={x(hover.month)} cy={y(value)} r={4} fill={seriesColor(r.index)} className="stroke-card" strokeWidth={2} />
                    ),
                  )}
                </g>
              )}
            </svg>
          )}
          {hover && hoverRows && (
            <div
              className="pointer-events-none absolute top-2 z-10 min-w-48 rounded-lg bg-popover p-2.5 text-xs text-popover-foreground shadow-md ring-1 ring-foreground/10"
              style={hover.px > width / 2 ? { right: width - hover.px + 14 } : { left: hover.px + 14 }}
            >
              <div className="mb-1 text-muted-foreground">
                Year {Math.floor(hover.month / 12) + 1}, month {(hover.month % 12) + 1}
              </div>
              {hoverRows.map(({ r, value }) => (
                <div key={r.offer.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                  <SeriesKey index={r.index} />
                  <span className="truncate text-muted-foreground">{r.offer.name}</span>
                  <span className="text-right font-semibold tabular-nums">{value == null ? "paid off" : eur(value)}</span>
                </div>
              ))}
              <div className="mt-1 border-t pt-1 text-muted-foreground">
                Comfortable ({pct(comfortPct, 0)}): {eur(comfortAt(Math.floor(hover.month / 12) + 1))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
