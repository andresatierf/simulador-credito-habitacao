import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Scenario } from "@/lib/finance/types";

import { parseScenario } from "./codec";
import { newId } from "./defaults";

export interface SavedScenario {
  id: string;
  name: string;
  savedAt: string;
  scenario: Scenario;
}

interface ScenarioStore {
  /** Last valid state of the form, restored on the next visit. */
  draft: Scenario | null;
  saved: SavedScenario[];
  showRepaymentsInChart: boolean;
  setDraft: (scenario: Scenario) => void;
  saveScenario: (name: string, scenario: Scenario) => SavedScenario;
  deleteScenario: (id: string) => void;
  setShowRepaymentsInChart: (show: boolean) => void;
}

export const useScenarioStore = create<ScenarioStore>()(
  persist(
    (set) => ({
      draft: null,
      saved: [],
      showRepaymentsInChart: false,
      setDraft: (draft) => set({ draft }),
      saveScenario: (name, scenario) => {
        const entry: SavedScenario = {
          id: newId(),
          name,
          savedAt: new Date().toISOString(),
          scenario,
        };
        set((state) => ({
          saved: [entry, ...state.saved.filter((s) => s.name !== name)],
        }));
        return entry;
      },
      deleteScenario: (id) => set((state) => ({ saved: state.saved.filter((s) => s.id !== id) })),
      setShowRepaymentsInChart: (showRepaymentsInChart) => set({ showRepaymentsInChart }),
    }),
    {
      name: "simulador-credito-habitacao",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Drop anything that no longer matches the scenario schema instead of crashing on it.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ScenarioStore>;
        return {
          ...current,
          draft: p.draft ? parseScenario(p.draft) : null,
          saved: (p.saved ?? []).flatMap((s) => {
            const scenario = parseScenario(s.scenario);
            return scenario ? [{ ...s, scenario }] : [];
          }),
          showRepaymentsInChart: p.showRepaymentsInChart ?? false,
        };
      },
    },
  ),
);
