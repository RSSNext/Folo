import { Button } from "@follow/components/ui/button/index.js"
import { Input } from "@follow/components/ui/input/index.js"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@follow/components/ui/select/index.jsx"
import { ResponsiveSelect } from "@follow/components/ui/select/responsive.js"
import { filterFieldOptions, filterOperatorOptions } from "@follow/store/action/constant"
import { useActionRule } from "@follow/store/action/hooks"
import { actionActions } from "@follow/store/action/store"
import { cn } from "@follow/utils/utils"
import type { ActionFeedField, ActionOperation } from "@follow-app/client-sdk"
import { Fragment } from "react"
import { useTranslation } from "react-i18next"

import { ViewSelectContent } from "~/modules/feed/view-select-content"

type WhenSectionProps = {
  index: number
  variant?: "detail" | "compact"
}

export const WhenSection = ({ index, variant = "detail" }: WhenSectionProps) => {
  const { t } = useTranslation("settings")

  const disabled = useActionRule(index, (a) => a.result.disabled)
  const condition = useActionRule(index, (a) => a.condition)

  const mode = condition.length > 0 ? "filter" : "all"

  const handleModeChange = (value: "all" | "filter") => {
    if (value === "all" && condition.length > 0) {
      actionActions.toggleRuleFilter(index)
    }

    if (value === "filter" && condition.length === 0) {
      actionActions.toggleRuleFilter(index)
    }
  }

  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-fill-secondary/40 bg-material-ultra-thin/80 p-4 shadow-sm",
        variant === "compact" && "bg-material-ultra-thin/70",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          {t("actions.action_card.when_feeds_match")}
        </span>
        <div className="flex items-center gap-1 rounded-full bg-fill-tertiary/60 p-1 text-xs font-medium text-text-secondary">
          <button
            type="button"
            className={cn(
              "rounded-full px-3 py-1 transition-colors",
              mode === "all"
                ? "bg-fill-secondary text-text shadow-sm"
                : "text-text-tertiary hover:text-text",
            )}
            disabled={disabled}
            onClick={() => handleModeChange("all")}
          >
            {t("actions.action_card.all")}
          </button>
          <button
            type="button"
            className={cn(
              "rounded-full px-3 py-1 transition-colors",
              mode === "filter"
                ? "bg-fill-secondary text-text shadow-sm"
                : "text-text-tertiary hover:text-text",
            )}
            disabled={disabled}
            onClick={() => handleModeChange("filter")}
          >
            {t("actions.action_card.custom_filters")}
          </button>
        </div>
      </div>

      {mode === "filter" && (
        <div className="flex flex-col gap-4">
          {condition.map((orConditions, orConditionIdx) => {
            return (
              <Fragment key={orConditionIdx}>
                <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-fill-secondary/50 bg-fill-tertiary/40 p-4">
                  {orConditions.map((item, conditionIdx) => {
                    const actionConditionIndex = {
                      ruleIndex: index,
                      groupIndex: orConditionIdx,
                      conditionIndex,
                    }

                    const change = (key: string, value: string | number) => {
                      actionActions.pathCondition(actionConditionIndex, {
                        [key]: value,
                      })
                    }

                    const type =
                      filterFieldOptions.find((option) => option.value === item.field)?.type ||
                      "text"

                    return (
                      <div key={conditionIdx} className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-material-ultra-thin/90 p-3">
                          <ResponsiveSelect
                            placeholder="Select Field"
                            disabled={disabled}
                            value={item.field}
                            onValueChange={(value) => change("field", value as ActionFeedField)}
                            items={filterFieldOptions.map((option) => ({
                              ...option,
                              label: t(option.label),
                            }))}
                            triggerClassName="h-9 min-w-[160px]"
                          />
                          <OperationSelect
                            type={type}
                            disabled={disabled}
                            value={item.operator}
                            onValueChange={(value) => change("operator", value)}
                          />
                          <ValueInput
                            type={type}
                            value={item.value}
                            onChange={(value) => change("value", value)}
                            disabled={disabled}
                          />
                          <button
                            type="button"
                            aria-label={t("actions.action_card.summary.delete")}
                            className="flex size-9 items-center justify-center rounded-full border border-fill-secondary/40 text-text-tertiary transition-colors hover:border-fill-secondary hover:text-text disabled:opacity-50"
                            disabled={disabled}
                            onClick={() => {
                              actionActions.deleteConditionItem(actionConditionIndex)
                            }}
                          >
                            <i className="i-mgc-delete-2-cute-re" />
                          </button>
                        </div>
                        {conditionIdx !== orConditions.length - 1 && (
                          <div className="flex items-center text-xs text-text-tertiary">
                            <span className="rounded-full bg-fill-quaternary px-2 py-0.5 uppercase tracking-wide">
                              {t("actions.action_card.and")}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    buttonClassName="w-fit border-dashed border-fill-secondary/60"
                    disabled={disabled}
                    onClick={() => {
                      actionActions.addConditionItem({
                        ruleIndex: index,
                        groupIndex: orConditionIdx,
                      })
                    }}
                  >
                    <i className="i-mgc-add-cute-re mr-2" />
                    {t("actions.action_card.and")}
                  </Button>
                </div>
                {orConditionIdx !== condition.length - 1 && (
                  <div className="flex items-center justify-center">
                    <span className="rounded-full bg-fill-tertiary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                      {t("actions.action_card.or")}
                    </span>
                  </div>
                )}
              </Fragment>
            )
          })}
          <Button
            variant="outline"
            size="sm"
            buttonClassName="w-fit border-dashed border-fill-secondary/60"
            onClick={() => {
              actionActions.addConditionGroup({ ruleIndex: index })
            }}
            disabled={disabled}
          >
            <i className="i-mgc-add-cute-re mr-2" />
            {t("actions.action_card.or")}
          </Button>
        </div>
      )}
    </section>
  )
}

const OperationSelect = ({
  type,
  value,
  onValueChange,
  disabled,
}: {
  type: "text" | "number" | "view" | "status"
  value?: ActionOperation
  onValueChange?: (value: ActionOperation) => void
  disabled?: boolean
}) => {
  const { t } = useTranslation("settings")

  const options = filterOperatorOptions
    .filter((option) => option.types.includes(type))
    .map((option) => ({
      ...option,
      label: t(option.label),
    }))
  if (options.length === 1 && value === undefined) {
    onValueChange?.(options[0]!.value as ActionOperation)
  }
  return (
    <ResponsiveSelect
      placeholder="Select Operation"
      disabled={disabled}
      value={value}
      onValueChange={(nextValue) => onValueChange?.(nextValue as ActionOperation)}
      items={options}
      triggerClassName="h-9 min-w-[150px]"
    />
  )
}

const ValueInput = ({
  type,
  value,
  onChange,
  disabled,
}: {
  type: string
  value?: string | number
  onChange: (value: string | number) => void
  disabled?: boolean
}) => {
  switch (type) {
    case "view": {
      return (
        <Select
          disabled={disabled}
          onValueChange={(nextValue) => onChange(nextValue)}
          value={value as string | undefined}
        >
          <CommonSelectTrigger />
          <ViewSelectContent />
        </Select>
      )
    }
    case "status": {
      if (value === undefined) {
        onChange("collected")
      }
      return (
        <Select
          disabled={disabled}
          onValueChange={(nextValue) => onChange(nextValue)}
          value={value as string | undefined}
        >
          <CommonSelectTrigger />
          <SelectContent>
            <SelectItem value="collected">Collected</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>
      )
    }
    case "number": {
      return (
        <Input
          disabled={disabled}
          type="number"
          value={value}
          className="h-9"
          onChange={(event) => onChange(event.target.value)}
        />
      )
    }
    default: {
      return (
        <Input
          disabled={disabled}
          value={value as string | undefined}
          className="h-9"
          onChange={(event) => onChange(event.target.value)}
        />
      )
    }
  }
}

const CommonSelectTrigger = () => (
  <SelectTrigger className="h-9 min-w-[150px]">
    <SelectValue />
  </SelectTrigger>
)
