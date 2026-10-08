import { cn } from "@/lib/utils"

/** Offer colors follow the offer's position in the list, never its rank. Eight validated slots. */
export function seriesColor(index: number): string {
  return `var(--series-${(index % 8) + 1})`
}

/** Color key next to an offer's name: a short line (as on the chart) or a square swatch. */
export function SeriesKey({ index, shape = "line", className }: { index: number; shape?: "line" | "square"; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0", shape === "line" ? "h-0.75 w-3.5 rounded-full" : "size-3 rounded-[3px]", className)}
      style={{ background: seriesColor(index) }}
    />
  )
}
