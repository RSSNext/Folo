import { Button } from "@follow/components/ui/button/index.js"
import { Input } from "@follow/components/ui/input/index.js"
import { Radio, RadioGroup } from "@follow/components/ui/radio-group/index.js"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@follow/components/ui/select/index.jsx"
import { ResponsiveSelect } from "@follow/components/ui/select/responsive.js"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@follow/components/ui/table/index.jsx"
import type { ActionFeedField, ActionOperation } from "@follow/models/types"
import { cn } from "@follow/utils/utils"
import { Fragment, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { ViewSelectContent } from "~/modules/feed/view-select-content"
import { actionActions, useActionByIndex } from "~/store/action"

export const FeedFilter = ({ index }: { index: number }) => {
  const { t } = useTranslation("settings")

  const FeedOptions = useMemo(() => {
    return [
      {
        label: t("actions.action_card.feed_options.status"),
        value: "status",
        type: "status",
      },
      {
        label: t("actions.action_card.feed_options.subscription_view"),
        value: "view",
        type: "view",
      },
      {
        label: t("actions.action_card.feed_options.feed_title"),
        value: "title",
      },
      {
        label: t("actions.action_card.feed_options.feed_category"),
        value: "category",
      },
      {
        label: t("actions.action_card.feed_options.site_url"),
        value: "site_url",
      },
      {
        label: t("actions.action_card.feed_options.feed_url"),
        value: "feed_url",
      },
      {
        label: t("actions.action_card.feed_options.entry_title"),
        value: "entry_title",
      },
      {
        label: t("actions.action_card.feed_options.entry_content"),
        value: "entry_content",
      },
      {
        label: t("actions.action_card.feed_options.entry_url"),
        value: "entry_url",
      },
      {
        label: t("actions.action_card.feed_options.entry_author"),
        value: "entry_author",
      },
      {
        label: t("actions.action_card.feed_options.entry_media_length"),
        value: "entry_media_length",
        type: "number",
      },
    ]
  }, [t])

  const disabled = useActionByIndex(index, (a) => a.result.disabled)
  const condition = useActionByIndex(index, (a) => a.condition)

  const onChange = actionActions.updateByIndex.bind(null, index)
  return (
    <div className="w-full shrink space-y-3 overflow-auto">
      <p className="font-medium text-zinc-500">{t("actions.action_card.when_feeds_match")}</p>
      <div className="flex flex-col gap-2 pl-4">
        <RadioGroup
          value={condition.length > 0 ? "filter" : "all"}
          onValueChange={(value) => {
            onChange((data) => {
              if (value === "all") {
                data.condition = []
              } else {
                data.condition = [[{}]]
              }
            })
          }}
        >
          <Radio disabled={disabled} label={t("actions.action_card.all")} value="all" />
          <Radio
            disabled={disabled}
            label={t("actions.action_card.custom_filters")}
            value="filter"
          />
        </RadioGroup>
      </div>

      {condition.length > 0 && (
        <div className="pl-6">
          <Table>
            <FieldTableHeader />
            <TableBody>
              {condition.flatMap((orConditions, orConditionIdx) => {
                return orConditions.map((condition, conditionIdx) => {
                  const change = (key: string, value: string | number) => {
                    onChange((data) => {
                      if (!data.condition[orConditionIdx]) {
                        data.condition[orConditionIdx] = [{}]
                      }
                      data.condition[orConditionIdx][conditionIdx]![key] = value
                    })
                  }
                  const type =
                    FeedOptions.find((option) => option.value === condition.field)?.type || "text"
                  return (
                    <Fragment key={`${orConditionIdx}${conditionIdx}`}>
                      {conditionIdx === 0 && orConditionIdx !== 0 && (
                        <TableRow className="flex h-16 items-center">
                          <Button disabled variant="outline">
                            {t("actions.action_card.or")}
                          </Button>
                        </TableRow>
                      )}
                      <TableRow className="max-sm:flex max-sm:flex-col">
                        <TableCell
                          size="sm"
                          className="max-sm:flex max-sm:items-center max-sm:justify-between max-sm:pr-0"
                        >
                          <span className="sm:hidden">{t("actions.action_card.field")}</span>
                          <ResponsiveSelect
                            placeholder="Select Field"
                            disabled={disabled}
                            value={condition.field}
                            onValueChange={(value) => change("field", value as ActionFeedField)}
                            items={FeedOptions}
                            triggerClassName="max-sm:w-fit"
                          />
                        </TableCell>
                        <OperationTableCell
                          type={type}
                          disabled={disabled}
                          value={condition.operator}
                          onValueChange={(value) => change("operator", value)}
                        />
                        <TableCell
                          size="sm"
                          className="max-sm:flex max-sm:items-center max-sm:justify-between max-sm:gap-4 max-sm:pr-0"
                        >
                          <span className="sm:hidden">{t("actions.action_card.value")}</span>
                          <ValueTableCell
                            type={type}
                            value={condition.value}
                            onChange={(value) => change("value", value)}
                            disabled={disabled}
                          />
                        </TableCell>

                        <ActionTableCell
                          disabled={disabled}
                          onAnd={() => {
                            onChange((data) => {
                              data.condition[orConditionIdx]!.push({})
                            })
                          }}
                          onDelete={() => {
                            onChange((data) => {
                              if (data.condition[orConditionIdx]!.length === 1) {
                                data.condition.splice(orConditionIdx, 1)
                              } else {
                                data.condition[orConditionIdx]!.splice(conditionIdx, 1)
                              }
                            })
                          }}
                        />
                      </TableRow>
                      {conditionIdx !== orConditions.length - 1 && (
                        <TableRow className="relative flex items-center">
                          <div className="relative">
                            <Button disabled variant="outline">
                              {t("actions.action_card.and")}
                            </Button>
                            <div className="bg-theme-disabled absolute left-1/2 h-[5px] w-px" />
                            <div className="bg-theme-disabled absolute left-1/2 top-0 h-[5px] w-px -translate-y-full" />
                          </div>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })
              })}
            </TableBody>
          </Table>
          <OrTableRow
            disabled={disabled}
            onClick={() => {
              onChange((data) => {
                data.condition.push([{}])
              })
            }}
          />
        </div>
      )}
    </div>
  )
}

const OperationTableCell = ({
  type,
  value,
  onValueChange,
  disabled,
}: {
  type: string
  value?: ActionOperation
  onValueChange?: (value: ActionOperation) => void
  disabled?: boolean
}) => {
  const { t } = useTranslation("settings")

  const OperationOptions = useMemo(() => {
    return [
      {
        label: t("actions.action_card.operation_options.contains"),
        value: "contains",
        types: ["text"],
      },
      {
        label: t("actions.action_card.operation_options.does_not_contain"),
        value: "not_contains",
        types: ["text"],
      },
      {
        label: t("actions.action_card.operation_options.is_equal_to"),
        value: "eq",
        types: ["number", "text", "view", "status"],
      },
      {
        label: t("actions.action_card.operation_options.is_not_equal_to"),
        value: "not_eq",
        types: ["number", "text", "view"],
      },
      {
        label: t("actions.action_card.operation_options.is_greater_than"),
        value: "gt",
        types: ["number"],
      },
      {
        label: t("actions.action_card.operation_options.is_less_than"),
        value: "lt",
        types: ["number"],
      },
      {
        label: t("actions.action_card.operation_options.matches_regex"),
        value: "regex",
        types: ["text"],
      },
    ]
  }, [t])

  const options = OperationOptions.filter((option) => option.types.includes(type))
  if (options.length === 1 && value === undefined) {
    onValueChange?.(options[0]!.value as ActionOperation)
  }
  return (
    <TableCell
      size="sm"
      className="max-sm:flex max-sm:items-center max-sm:justify-between max-sm:pr-0"
    >
      <span className="sm:hidden">{t("actions.action_card.operator")}</span>
      <ResponsiveSelect
        placeholder="Select Field"
        disabled={disabled}
        value={value}
        onValueChange={(value) => onValueChange?.(value as ActionOperation)}
        items={options}
        triggerClassName="h-8 max-sm:w-fit"
      />
    </TableCell>
  )
}

const ValueTableCell = ({
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
  const { t } = useTranslation()

  switch (type) {
    case "view": {
      return (
        <Select
          disabled={disabled}
          onValueChange={(value) => onChange(value)}
          value={value as string | undefined}
        >
          <CommonSelectTrigger className="max-sm:w-fit" />
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
          <CommonSelectTrigger className="max-sm:w-fit" />
          <SelectContent>
            <SelectItem value="collected">
              <div className="flex items-center gap-2">
                <span>{t("words.starred")}</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      )
    }
    default: {
      return (
        <Input
          disabled={disabled}
          type={type}
          value={value}
          className="h-8"
          onChange={(e) => onChange(e.target.value)}
        />
      )
    }
  }
}

const CommonSelectTrigger = ({ className }: { className?: string }) => (
  <SelectTrigger className={cn("h-8", className)}>
    <SelectValue />
  </SelectTrigger>
)

const ActionTableCell = ({
  disabled,
  onAnd,
  onDelete,
}: {
  disabled?: boolean
  onAnd?: () => void
  onDelete?: () => void
}) => {
  const { t } = useTranslation("settings")
  return (
    <>
      <TableCell size="sm" className="max-sm:hidden">
        <Button variant="outline" className="w-full" disabled={disabled} onClick={onAnd}>
          {t("actions.action_card.and")}
        </Button>
      </TableCell>
      <TableCell size="sm" className="w-full max-sm:flex max-sm:space-x-2 max-sm:pr-0 lg:w-8">
        <Button className="w-full sm:hidden" variant="outline" disabled={disabled} onClick={onAnd}>
          {t("actions.action_card.and")}
        </Button>
        <Button variant="ghost" disabled={disabled} onClick={onDelete}>
          <i className="i-mgc-delete-2-cute-re size-5 text-zinc-600" />
        </Button>
      </TableCell>
    </>
  )
}

const OrTableRow = ({ onClick, disabled }: { onClick?: () => void; disabled?: boolean }) => {
  const { t } = useTranslation("settings")
  return (
    <Button
      variant="outline"
      className="mt-1 w-full gap-1"
      buttonClassName="py-1"
      onClick={onClick}
      disabled={disabled}
    >
      {t("actions.action_card.or")}
    </Button>
  )
}

const FieldTableHeader = () => {
  const { t } = useTranslation("settings")
  return (
    <TableHeader className="max-sm:hidden">
      <TableRow>
        <TableHead size="sm">{t("actions.action_card.field")}</TableHead>
        <TableHead size="sm">{t("actions.action_card.operator")}</TableHead>
        <TableHead size="sm">{t("actions.action_card.value")}</TableHead>
        <TableHead size="sm" />
      </TableRow>
    </TableHeader>
  )
}
