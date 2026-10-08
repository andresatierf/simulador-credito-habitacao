import { FolderOpenIcon, LinkIcon, MonitorIcon, MoonIcon, RotateCcwIcon, SaveIcon, SunIcon, Trash2Icon } from "lucide-react"
import * as React from "react"
import { z } from "zod"

import { useAppForm } from "@/components/form/form"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FieldGroup } from "@/components/ui/field"
import { toast } from "@/components/ui/toast"
import type { Scenario } from "@/lib/finance/types"
import { encodeScenario } from "@/lib/scenario/codec"
import { useScenarioStore } from "@/lib/scenario/store"

function SaveScenarioDialog({
  open,
  onOpenChange,
  getScenario,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  getScenario: () => Scenario
}) {
  const saveScenario = useScenarioStore((s) => s.saveScenario)
  const form = useAppForm({
    defaultValues: { name: "" },
    validators: { onSubmit: z.object({ name: z.string().trim().min(1, "Give the scenario a name") }) },
    onSubmit: ({ value, formApi }) => {
      saveScenario(value.name.trim(), getScenario())
      toast.add({ title: "Scenario saved", description: value.name.trim() })
      formApi.reset()
      onOpenChange(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void form.handleSubmit()
          }}
          className="flex flex-col gap-4"
        >
          <DialogHeader>
            <DialogTitle>Save scenario</DialogTitle>
            <DialogDescription>Saved in this browser. Saving with an existing name replaces it.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <form.AppField name="name">{(f) => <f.TextField label="Name" />}</form.AppField>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const THEME_ICON = { light: SunIcon, dark: MoonIcon, system: MonitorIcon } as const
const NEXT_THEME = { light: "dark", dark: "system", system: "light" } as const

export function AppHeader({
  getScenario,
  onLoad,
  onReset,
}: {
  getScenario: () => Scenario
  onLoad: (scenario: Scenario) => void
  onReset: () => void
}) {
  const [saveOpen, setSaveOpen] = React.useState(false)
  const saved = useScenarioStore((s) => s.saved)
  const deleteScenario = useScenarioStore((s) => s.deleteScenario)
  const { theme, setTheme } = useTheme()
  const ThemeIcon = THEME_ICON[theme]

  async function copyLink() {
    const url = new URL(window.location.href)
    url.search = `?s=${encodeScenario(getScenario())}`
    try {
      await navigator.clipboard.writeText(url.toString())
      toast.add({ title: "Link copied", description: "Anyone with the link sees this exact scenario." })
    } catch {
      toast.add({ title: "Couldn't copy the link", description: "Copy it from the address bar instead." })
    }
  }

  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="flex max-w-3xl flex-col gap-1.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Simulador Crédito Habitação</h1>
        <p className="text-sm text-muted-foreground">
          Test rates, terms and bank offers against the Banco de Portugal affordability rule (45% taxa de esforço, with
          the rate stress test). See the cash at signing, the monthly payment and the total cost of each.
        </p>
      </div>
      <div className="flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />}>
            <FolderOpenIcon data-icon="inline-start" />
            Scenarios
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setSaveOpen(true)}>
                <SaveIcon />
                Save current…
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyLink}>
                <LinkIcon />
                Copy link to this scenario
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onReset}>
                <RotateCcwIcon />
                Reset to defaults
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Saved in this browser</DropdownMenuLabel>
              {saved.length === 0 && <DropdownMenuItem disabled>No saved scenarios yet</DropdownMenuItem>}
              {saved.map((entry) => (
                <DropdownMenuItem key={entry.id} onClick={() => onLoad(entry.scenario)} className="justify-between">
                  <span className="truncate">{entry.name}</span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Delete ${entry.name}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteScenario(entry.id)
                    }}
                  >
                    <Trash2Icon />
                  </Button>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          size="icon"
          aria-label={`Theme: ${theme}. Switch to ${NEXT_THEME[theme]}`}
          onClick={() => setTheme(NEXT_THEME[theme])}
        >
          <ThemeIcon />
        </Button>
      </div>
      <SaveScenarioDialog open={saveOpen} onOpenChange={setSaveOpen} getScenario={getScenario} />
    </header>
  )
}
