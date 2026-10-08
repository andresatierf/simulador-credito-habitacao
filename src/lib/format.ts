/** Euro amounts and percentages, formatted the Portuguese way (€ after the number, comma decimals). */
const LOCALE = "pt-PT"

export function eur(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return "–"
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function pct(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return "–"
  return new Intl.NumberFormat(LOCALE, {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100)
}

export function signedEur(value: number): string {
  return `${value < 0 ? "−" : "+"}${eur(Math.abs(value))}`
}

export function duration(months: number): string {
  const years = Math.floor(months / 12)
  const rest = months % 12
  if (!rest) return `${years} ${years === 1 ? "yr" : "yrs"}`
  return `${years} ${years === 1 ? "yr" : "yrs"} ${rest} mo`
}
