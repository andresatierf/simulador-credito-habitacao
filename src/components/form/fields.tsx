import type * as React from "react"

import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { useFieldContext } from "./form-context"

/** Field id: TanStack Form names like `offers[2].spreadPct` made safe for `id`/`htmlFor`. */
function fieldId(name: string) {
  return `f-${name.replace(/[^\w-]/g, "_")}`
}

function useFieldState<T>() {
  const field = useFieldContext<T>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  return { field, id: fieldId(field.name), isInvalid }
}

interface BaseProps {
  label: React.ReactNode
  description?: React.ReactNode
  className?: string
}

export function NumberField({
  label,
  description,
  className,
  unit,
  step = 1,
  min,
  max,
}: BaseProps & { unit?: string; step?: number; min?: number; max?: number }) {
  const { field, id, isInvalid } = useFieldState<number>()
  const value = field.state.value
  return (
    <Field data-invalid={isInvalid} className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id={id}
          name={field.name}
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          max={max}
          value={Number.isFinite(value) ? value : ""}
          onBlur={field.handleBlur}
          onChange={(e) =>
            field.handleChange(
              e.target.value === "" ? Number.NaN : e.target.valueAsNumber
            )
          }
          aria-invalid={isInvalid}
          className="tabular-nums"
        />
        {unit && (
          <InputGroupAddon align="inline-end">
            <InputGroupText>{unit}</InputGroupText>
          </InputGroupAddon>
        )}
      </InputGroup>
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}

export function TextField({
  label,
  description,
  className,
  srOnlyLabel,
}: BaseProps & { srOnlyLabel?: boolean }) {
  const { field, id, isInvalid } = useFieldState<string>()
  return (
    <Field data-invalid={isInvalid} className={className}>
      <FieldLabel htmlFor={id} className={srOnlyLabel ? "sr-only" : undefined}>
        {label}
      </FieldLabel>
      <Input
        id={id}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}

export interface Option<T> {
  value: T
  label: string
}

export function SelectField<T extends string | number>({
  label,
  description,
  className,
  options,
}: BaseProps & { options: Option<T>[] }) {
  const { field, id, isInvalid } = useFieldState<T>()
  return (
    <Field data-invalid={isInvalid} className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        items={options}
        value={field.state.value}
        onValueChange={(value) =>
          value != null && field.handleChange(value as T)
        }
      >
        <SelectTrigger
          id={id}
          aria-invalid={isInvalid}
          className="w-full"
          onBlur={field.handleBlur}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={String(option.value)} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}

export function ToggleGroupField<T extends string>({
  label,
  description,
  className,
  options,
}: BaseProps & { options: Option<T>[] }) {
  const { field, isInvalid } = useFieldState<T>()
  return (
    <Field data-invalid={isInvalid} className={className}>
      <FieldTitle>{label}</FieldTitle>
      <ToggleGroup
        variant="outline"
        spacing={0}
        value={[field.state.value]}
        onValueChange={(values) =>
          values[0] && field.handleChange(values[0] as T)
        }
        aria-label={typeof label === "string" ? label : undefined}
        className="w-full"
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            className="flex-1"
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  )
}

export function SwitchField({ label, description, className }: BaseProps) {
  const { field, id } = useFieldState<boolean>()
  return (
    <Field orientation="horizontal" className={className}>
      <FieldContent>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FieldContent>
      <Switch
        id={id}
        checked={field.state.value}
        onCheckedChange={(checked) => field.handleChange(checked)}
      />
    </Field>
  )
}

export function CheckboxField({ label, description, className }: BaseProps) {
  const { field, id } = useFieldState<boolean>()
  return (
    <Field orientation="horizontal" className={className}>
      <Checkbox
        id={id}
        checked={field.state.value}
        onCheckedChange={(checked) => field.handleChange(checked)}
      />
      <FieldContent>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FieldContent>
    </Field>
  )
}

export function SliderField({
  label,
  description,
  className,
  min,
  max,
  step,
  format,
}: BaseProps & {
  min: number
  max: number
  step: number
  format: (value: number) => string
}) {
  const { field, id } = useFieldState<number>()
  return (
    <Field className={className}>
      <div className="flex items-baseline justify-between gap-2">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {format(field.state.value)}
        </span>
      </div>
      <Slider
        id={id}
        min={min}
        max={max}
        step={step}
        value={[field.state.value]}
        onValueChange={(value) =>
          field.handleChange(Array.isArray(value) ? value[0] : value)
        }
      />
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  )
}

/** Two-option toggle bound to a boolean field. */
export function BooleanToggleField({
  label,
  description,
  className,
  falseLabel,
  trueLabel,
}: BaseProps & { falseLabel: string; trueLabel: string }) {
  const { field } = useFieldState<boolean>()
  return (
    <Field className={className}>
      <FieldTitle>{label}</FieldTitle>
      <ToggleGroup
        variant="outline"
        spacing={0}
        value={[field.state.value ? "true" : "false"]}
        onValueChange={(values) =>
          values[0] && field.handleChange(values[0] === "true")
        }
        aria-label={typeof label === "string" ? label : undefined}
        className="w-full"
      >
        <ToggleGroupItem value="false" className="flex-1">
          {falseLabel}
        </ToggleGroupItem>
        <ToggleGroupItem value="true" className="flex-1">
          {trueLabel}
        </ToggleGroupItem>
      </ToggleGroup>
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  )
}
