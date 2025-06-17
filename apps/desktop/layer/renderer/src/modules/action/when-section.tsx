import { Button } from "@follow/components/ui/button/index.js"
import { Input } from "@follow/components/ui/input/index.js"
import { RadioGroup, RadioGroupItem } from "@follow/components/ui/radio-group/motion.js"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@follow/components/ui/select/index.jsx"
import { ResponsiveSelect } from "@follow/components/ui/select/responsive.js"
import type { ActionFeedField, ActionOperation } from "@follow/models/types"
import { filterFieldOptions, filterOperatorOptions } from "@follow/store/action/constant"
import { useActionRule } from "@follow/store/action/hooks"
import { actionActions } from "@follow/store/action/store"
import { Fragment } from "react"
import { useTranslation } from "react-i18next"

import { ViewSelectContent } from "~/modules/feed/view-select-content"

export const WhenSection = ({ index }: { index: number }) => {
  const { t } = useTranslation("settings")

  const disabled = useActionRule(index, (a) => a.result.disabled)
  const condition = useActionRule(index, (a) => a.condition)

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{t("actions.action_card.when_feeds_match")}</h2>
      <div className="pl-2">
        <RadioGroup
          value={condition.length > 0 ? "filter" : "all"}
          onValueChange={(value) => {
            actionActions.patchRule(index, {
              condition: value === "all" ? [] : [[{}]],
            })
          }}
          className="flex gap-4"
        >
          <RadioGroupItem disabled={disabled} label={t("actions.action_card.all")} value="all" />
          <RadioGroupItem
            disabled={disabled}
            label={t("actions.action_card.custom_filters")}
            value="filter"
          />
        </RadioGroup>
      </div>

      {condition.length > 0 && (
        <div className="flex flex-col gap-4 pl-2 pt-4">
          {condition.map((orConditions, orConditionIdx) => {
            return (
              <Fragment key={orConditionIdx}>
                <div className="@[500px]:p-4 group/or relative flex flex-col gap-2 rounded-lg border p-2 pl-6">
                  <div className="bg-border absolute left-3 top-9 h-[calc(100%-4.5rem)] w-px" />
                  {orConditions.map((condition, conditionIdx) => {
                    const actionConditionIndex = {
                      ruleIndex: index,
                      groupIndex: orConditionIdx,
                      conditionIndex: conditionIdx,
                    }

                    const change = (key: string, value: string | number) => {
                      actionActions.pathCondition(actionConditionIndex, {
                        [key]: value,
                      })
                    }
                    const type =
                      filterFieldOptions.find((option) => option.value === condition.field)?.type ||
                      "text"
                    return (
                      <div className="flex flex-col gap-2" key={conditionIdx}>
                        <div className="group/condition-item relative flex items-center gap-2">
                          <div className="bg-border absolute -left-3.5 top-1/2 h-px w-3 -translate-y-1/2" />
                          <div className="bg-background absolute -left-3.5 top-1/2 size-1.5 -translate-y-1/2 rounded-full border" />
                          <ResponsiveSelect
                            placeholder="Select Field"
                            disabled={disabled}
                            value={condition.field}
                            onValueChange={(value) => change("field", value as ActionFeedField)}
                            items={filterFieldOptions.map((option) => ({
                              ...option,
                              label: t(option.label),
                            }))}
                            triggerClassName="h-8"
                          />
                          <OperationSelect
                            type={type}
                            disabled={disabled}
                            value={condition.operator}
                            onValueChange={(value) => change("operator", value)}
                          />
                          <ValueInput
                            type={type}
                            value={condition.value}
                            onChange={(value) => change("value", value)}
                            disabled={disabled}
                          />
                          <Button
                            variant="ghost"
                            buttonClassName="opacity-0 group-hover/condition-item:opacity-100"
                            disabled={disabled}
                            onClick={() => {
                              actionActions.deleteConditionItem(actionConditionIndex)
                            }}
                          >
                            <i className="i-mgc-delete-2-cute-re" />
                          </Button>
                        </div>
                        {conditionIdx !== orConditions.length - 1 && (
                          <div className="flex items-center pl-2">
                            <span className="text-muted-foreground text-sm">
                              {t("actions.action_card.and")}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  <Button
                    variant="outline"
                    buttonClassName="mt-2"
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
                  <div className="relative flex h-8 w-full items-center justify-center">
                    <div className="bg-border absolute left-0 top-1/2 h-px w-full" />
                    <span className="text-muted-foreground bg-background z-[1] px-2 text-sm">
                      {t("actions.action_card.or")}
                    </span>
                  </div>
                )}
              </Fragment>
            )
          })}
          <Button
            variant="outline"
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
    </div>
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
      onValueChange={(value) => onValueChange?.(value as ActionOperation)}
      items={options}
      triggerClassName="h-8"
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
          onValueChange={(value) => onChange(value)}
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
          onValueChange={(value) => onChange(value)}
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
          className="h-8"
          onChange={(e) => onChange(e.target.value)}
        />
      )
    }
    default: {
      return (
        <Input
          disabled={disabled}
          value={value as string | undefined}
          className="h-8"
          onChange={(e) => onChange(e.target.value)}
        />
      )
    }
  }
}

const CommonSelectTrigger = () => (
  <SelectTrigger className="h-8">
    <SelectValue />
  </SelectTrigger>
)
