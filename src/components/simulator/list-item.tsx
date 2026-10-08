import { CopyIcon, EyeIcon, EyeOffIcon, Trash2Icon } from "lucide-react"
import type * as React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

function IconAction({
  label,
  icon: Icon,
  onClick,
  disabled,
}: {
  label: string
  icon: React.ComponentType
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            onClick={onClick}
            disabled={disabled}
          />
        }
      >
        <Icon />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

/** One entry of an editable list (borrower, offer, repayment) with show/hide, copy and remove actions. */
export function ListItem({
  title,
  enabled,
  onToggle,
  onCopy,
  onRemove,
  canCopy = true,
  canRemove = true,
  noun,
  children,
  footer,
}: {
  title: React.ReactNode
  enabled: boolean
  onToggle: () => void
  onCopy: () => void
  onRemove: () => void
  canCopy?: boolean
  canRemove?: boolean
  noun: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <Card
      size="sm"
      className={cn("bg-muted/40 transition-opacity", !enabled && "opacity-55")}
    >
      <CardHeader className="items-center">
        <div className="min-w-0">{title}</div>
        <CardAction className="flex gap-0.5">
          <IconAction
            label={enabled ? `Hide ${noun}` : `Show ${noun}`}
            icon={enabled ? EyeIcon : EyeOffIcon}
            onClick={onToggle}
          />
          <IconAction
            label={`Copy ${noun}`}
            icon={CopyIcon}
            onClick={onCopy}
            disabled={!canCopy}
          />
          <IconAction
            label={`Remove ${noun}`}
            icon={Trash2Icon}
            onClick={onRemove}
            disabled={!canRemove}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {children}
        {footer}
      </CardContent>
    </Card>
  )
}
