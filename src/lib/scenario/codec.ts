import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string"

import type { Scenario } from "@/lib/finance/types"

import { defaultScenario, newId } from "./defaults"
import { scenarioSchema } from "./schema"

/** Bump when the stored shape changes in a way `migrate` must handle. */
const VERSION = 1

type Envelope = { v: number; s: unknown }

/** Fill in fields added after a scenario was saved, so old links and saved scenarios keep working. */
function migrate(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw
  const base = defaultScenario()
  const s = raw as Record<string, unknown>
  return {
    ...base,
    ...s,
    property: { ...base.property, ...(s.property as object) },
    market: { ...base.market, ...(s.market as object) },
    wealth: { ...base.wealth, ...(s.wealth as object) },
  }
}

function withIds(s: Scenario): Scenario {
  return {
    ...s,
    borrowers: s.borrowers.map((b) => ({ ...b, id: b.id || newId() })),
    offers: s.offers.map((o) => ({ ...o, id: o.id || newId() })),
    repayments: s.repayments.map((r) => ({ ...r, id: r.id || newId() })),
  }
}

function withoutIds(s: Scenario): unknown {
  const strip = <T extends { id: string }>(item: T): Omit<T, "id"> => {
    const copy: Partial<T> = { ...item }
    delete copy.id
    return copy as Omit<T, "id">
  }
  return { ...s, borrowers: s.borrowers.map(strip), offers: s.offers.map(strip), repayments: s.repayments.map(strip) }
}

/** Parse untrusted scenario data (URL, storage). Returns null when it can't be used. */
export function parseScenario(raw: unknown): Scenario | null {
  const migrated = migrate(raw) as Record<string, unknown> | undefined
  if (!migrated) return null
  const withTempIds = {
    ...migrated,
    borrowers: (migrated.borrowers as Array<Record<string, unknown>> | undefined)?.map((b) => ({ id: "", ...b })),
    offers: (migrated.offers as Array<Record<string, unknown>> | undefined)?.map((o) => ({ id: "", ...o })),
    repayments: (migrated.repayments as Array<Record<string, unknown>> | undefined)?.map((r) => ({ id: "", ...r })),
  }
  const result = scenarioSchema.safeParse(withTempIds)
  return result.success ? withIds(result.data as Scenario) : null
}

/** Compact, URL-safe encoding of a scenario. IDs are dropped and regenerated on decode. */
export function encodeScenario(scenario: Scenario): string {
  const envelope: Envelope = { v: VERSION, s: withoutIds(scenario) }
  return compressToEncodedURIComponent(JSON.stringify(envelope))
}

export function decodeScenario(encoded: string): Scenario | null {
  try {
    const json = decompressFromEncodedURIComponent(encoded)
    if (!json) return null
    const envelope = JSON.parse(json) as Envelope
    return parseScenario(envelope.s)
  } catch {
    return null
  }
}
