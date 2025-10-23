import { Button } from "@follow/components/ui/button/index.js"
import { Input } from "@follow/components/ui/input/index.js"
import * as ScrollArea from "@follow/components/ui/scroll-area/ScrollArea.js"
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
    <div className="group/rule flex size-full flex-col @container">
      <div className="shrink-0 border-b border-fill-tertiary px-5 py-4">
        <RuleCardToolbar index={index} />
      </div>
      <ScrollArea.ScrollArea rootClassName="flex-1" viewportClassName="h-full">
        <div className="p-5">
          <RuleCardContent index={index} />
        </div>
      </ScrollArea.ScrollArea>
    </div>
  )
}

const RuleCardContent = ({ index }: { index: number }) => {
  return (
    <div className="flex flex-col gap-6 @[900px]:grid @[900px]:grid-cols-2 @[900px]:items-start @[900px]:gap-6">
      <WhenSection index={index} />
      <ThenSection index={index} />
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
    <div className="overflow-hidden rounded-lg border border-fill-secondary bg-transparent">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-fill-quinary"
      >
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-text">{displayName}</span>
          <span className="line-clamp-1 text-xs text-text-tertiary">{whenSummary}</span>
          <span className="line-clamp-1 text-xs text-text-tertiary">{actionSummary}</span>
        </div>
        <div className="flex items-center gap-2">
          {disabled && (
            <span className="rounded-md border border-fill-secondary bg-fill-quaternary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-secondary">
              {t("actions.action_card.summary.disabled")}
            </span>
          )}
          <i
            className={cn(
              "size-4 text-text-tertiary transition-transform",
              open ? "i-mingcute-arrow-up-line" : "i-mingcute-arrow-down-line",
            )}
          />
        </div>
      </button>
      {open ? (
        <div className="space-y-4 border-t border-fill-tertiary bg-transparent p-4">
          <RuleCardToolbar index={index} />
          <RuleCardContent index={index} />
        </div>
      ) : null}
    </div>
  )
}

const RuleCardToolbar = ({ index }: { index: number }) => {
  const { t } = useTranslation("settings")
  const name = useActionRule(index, (a) => a.name)
  const disabled = useActionRule(index, (a) => a.result.disabled)
  const ruleCount = useActionRules((s) => s.length)
  const mutation = useUpdateActionsMutation()
  const { ask } = useDialog()

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
    <div className={"flex w-full flex-wrap items-center gap-3"}>
      <Input
        value={name}
        placeholder={t("actions.action_card.name")}
        className="h-9 min-w-[160px] flex-1 bg-transparent px-3 text-base font-semibold shadow-none ring-0 focus-visible:ring-0"
        onChange={(e) => {
          actionActions.patchRule(index, { name: e.target.value })
        }}
      />
      <div className="flex items-center gap-3">
        <Switch
          checked={!disabled}
          onCheckedChange={(checked) => {
            actionActions.patchRule(index, {
              result: { disabled: !checked },
            })
          }}
          aria-label={t("actions.action_card.summary.toggle")}
        />
        <Button
          variant="ghost"
          size="sm"
          aria-label={t("actions.action_card.summary.delete")}
          buttonClassName="size-8 p-0"
          onClick={handleDelete}
        >
          <i className="i-mgc-delete-2-cute-re" />
        </Button>
      </div>
    </div>
  )
}
