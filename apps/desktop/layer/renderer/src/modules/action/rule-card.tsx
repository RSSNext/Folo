import { Input } from "@follow/components/ui/input/index.js"
import { Switch } from "@follow/components/ui/switch/index.jsx"
import { useActionRule, useActionRules, useUpdateActionsMutation } from "@follow/store/action/hooks"
import { actionActions } from "@follow/store/action/store"
import { nextFrame } from "@follow/utils"
import { cn } from "@follow/utils/utils"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { useDialog } from "~/components/ui/modal/stacked/hooks"

import { buildActionSummary, buildConditionSummary, getRuleDisplayName } from "./rule-summary"
import { ThenSection } from "./then-section"
import { WhenSection } from "./when-section"

type RuleCardProps = {
  index: number
  mode?: "detail" | "compact"
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export const RuleCard = ({
  index,
  mode = "detail",
  defaultOpen = false,
  onOpenChange,
}: RuleCardProps) => {
  if (mode === "compact") {
    return <CompactRuleCard index={index} defaultOpen={defaultOpen} onOpenChange={onOpenChange} />
  }

  return (
    <div className="group/rule flex h-full flex-col gap-6 rounded-3xl border border-fill-secondary/40 bg-material-ultra-thin/90 p-6 shadow-lg @container">
      <RuleCardToolbar index={index} variant="detail" />
      <RuleCardContent index={index} variant="detail" />
    </div>
  )
}

const RuleCardContent = ({ index, variant }: { index: number; variant: "detail" | "compact" }) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        variant === "detail" &&
          "@[900px]:grid @[900px]:grid-cols-2 @[900px]:items-start @[900px]:gap-6",
      )}
    >
      <WhenSection index={index} variant={variant} />
      <ThenSection index={index} variant={variant} />
    </div>
  )
}

const CompactRuleCard = ({
  index,
  defaultOpen,
  onOpenChange,
}: {
  index: number
  defaultOpen: boolean
  onOpenChange?: (open: boolean) => void
}) => {
  const { t } = useTranslation("settings")
  const rule = useActionRule(index)
  const disabled = useActionRule(index, (a) => a.result.disabled)
  const [open, setOpen] = useState(defaultOpen)

  useEffect(() => {
    setOpen(defaultOpen)
  }, [defaultOpen])

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev
      onOpenChange?.(next)
      return next
    })
  }

  const displayName = getRuleDisplayName(rule, index, t)
  const whenSummary = buildConditionSummary(rule, t)
  const actionSummary = buildActionSummary(rule, t)

  return (
    <div className="overflow-hidden rounded-3xl border border-fill-secondary/40 bg-material-ultra-thin/80 shadow-sm">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-fill-secondary/40"
      >
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-text">{displayName}</span>
          <span className="line-clamp-1 text-xs text-text-tertiary">{whenSummary}</span>
          <span className="line-clamp-1 text-xs text-text-tertiary">{actionSummary}</span>
        </div>
        <div className="flex items-center gap-2">
          {disabled && (
            <span className="rounded-full bg-fill-quaternary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
              {t("actions.action_card.summary.disabled")}
            </span>
          )}
          <i
            className={cn(
              "size-4 text-text-tertiary transition-transform",
              open ? "i-mgc-arrow-up-cute-re" : "i-mgc-arrow-down-cute-re",
            )}
          />
        </div>
      </button>
      {open ? (
        <div className="space-y-4 border-t border-fill-secondary/40 bg-material-ultra-thin/90 p-4">
          <RuleCardToolbar index={index} variant="compact" />
          <RuleCardContent index={index} variant="compact" />
        </div>
      ) : null}
    </div>
  )
}

const RuleCardToolbar = ({ index, variant }: { index: number; variant: "detail" | "compact" }) => {
  const { t } = useTranslation("settings")
  const name = useActionRule(index, (a) => a.name)
  const disabled = useActionRule(index, (a) => a.result.disabled)
  const ruleCount = useActionRules((s) => s.length)
  const mutation = useUpdateActionsMutation()
  const { ask } = useDialog()

  const containerClass = cn(
    "flex w-full flex-wrap items-center gap-3 rounded-2xl border border-fill-secondary/40 bg-fill-tertiary/50 p-4",
    variant === "compact" && "rounded-2xl border border-fill-secondary/40 bg-fill-tertiary/40 p-4",
  )

  const handleDelete = () => {
    if (ruleCount === 1) {
      ask({
        title: t("actions.action_card.summary.delete_title"),
        variant: "danger",
        message: t("actions.action_card.summary.delete_message"),
        onConfirm: () => {
          actionActions.deleteRule(index)
          nextFrame(() => {
            mutation.mutate()
          })
        },
      })
    } else {
      actionActions.deleteRule(index)
    }
  }

  return (
    <div className={containerClass}>
      <Input
        value={name}
        placeholder={t("actions.action_card.name")}
        className="h-9 min-w-[160px] flex-1 bg-transparent px-3 text-base font-semibold shadow-none ring-0 focus-visible:ring-0"
        onChange={(e) => {
          actionActions.patchRule(index, { name: e.target.value })
        }}
      />
      <div className="flex items-center gap-3">
        <StatusPill disabled={!!disabled} />
        <Switch
          checked={!disabled}
          onCheckedChange={(checked) => {
            actionActions.patchRule(index, {
              result: { disabled: !checked },
            })
          }}
          aria-label={t("actions.action_card.summary.toggle")}
        />
        <button
          type="button"
          aria-label={t("actions.action_card.summary.delete")}
          className="flex size-9 items-center justify-center rounded-full border border-fill-secondary/60 bg-fill-tertiary/60 text-text-tertiary transition-colors hover:border-fill-secondary hover:text-text"
          onClick={handleDelete}
        >
          <i className="i-mgc-delete-2-cute-re" />
        </button>
      </div>
    </div>
  )
}

const StatusPill = ({ disabled }: { disabled: boolean }) => {
  const { t } = useTranslation("settings")

  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        disabled
          ? "bg-fill-quaternary text-text-tertiary"
          : "bg-fill-secondary text-text-secondary",
      )}
    >
      {disabled
        ? t("actions.action_card.summary.disabled")
        : t("actions.action_card.summary.active")}
    </span>
  )
}
