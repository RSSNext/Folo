import { Button } from "@follow/components/ui/button/index.js"
import { Input } from "@follow/components/ui/input/index.js"
import type { ActionAction } from "@follow/store/action/constant"
import { useActionRule } from "@follow/store/action/hooks"
import { actionActions } from "@follow/store/action/store"
import { cn } from "@follow/utils/utils"
import type { ActionId } from "@follow-app/client-sdk"
import { merge } from "es-toolkit/compat"
import type { ReactNode } from "react"
import { Fragment, useMemo } from "react"
import { useTranslation } from "react-i18next"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu/dropdown-menu.js"

import { useSettingModal } from "../settings/modal/useSettingModal"
import { availableActionMap } from "./constants"

type ThenSectionProps = {
  index: number
  variant?: "detail" | "compact"
}

export const ThenSection = ({ index, variant: _variant = "detail" }: ThenSectionProps) => {
  const { t } = useTranslation("settings")
  const result = useActionRule(index, (a) => a.result)

  const rewriteRules = useActionRule(index, (a) => a.result.rewriteRules)
  const webhooks = useActionRule(index, (a) => a.result.webhooks)
  const settingModalPresent = useSettingModal()

  const disabled = useActionRule(index, (a) => a.result.disabled)

  const availableActions = useMemo(() => {
    const extendedAvailableActionMap: Record<
      ActionId,
      ActionAction & {
        config?: () => ReactNode
      }
    > = merge(availableActionMap, {
      rewriteRules: {
        config: () => (
          <div className="flex flex-col gap-3">
            {!rewriteRules || rewriteRules.length === 0 ? (
              <button
                type="button"
                disabled={disabled}
                className="flex items-center justify-between rounded-lg bg-fill-quaternary px-4 py-3 text-xs text-text-tertiary transition-colors hover:bg-fill-tertiary hover:text-text disabled:opacity-50"
                onClick={() => {
                  actionActions.addRewriteRule(index)
                }}
              >
                <span>{t("actions.action_card.rewrite_rules")}</span>
                <i className="i-mgc-add-cute-re" />
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                {rewriteRules.map((rule, rewriteIdx) => {
                  const change = (key: "from" | "to", value: string) => {
                    actionActions.updateRewriteRule({
                      index,
                      rewriteRuleIndex: rewriteIdx,
                      key,
                      value,
                    })
                  }
                  return (
                    <div
                      key={rewriteIdx}
                      className="flex flex-col gap-3 rounded-lg bg-fill-quaternary p-4"
                    >
                      <div className="grid gap-3 @[520px]:grid-cols-2">
                        <label className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                          {t("actions.action_card.from")}
                          <Input
                            disabled={disabled}
                            value={rule.from}
                            className="mt-2 h-9"
                            onChange={(event) => change("from", event.target.value)}
                          />
                        </label>
                        <label className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                          {t("actions.action_card.to")}
                          <Input
                            disabled={disabled}
                            value={rule.to}
                            className="mt-2 h-9"
                            onChange={(event) => change("to", event.target.value)}
                          />
                        </label>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <IconButton
                          icon="i-mgc-add-cute-re"
                          ariaLabel={t("actions.action_card.add")}
                          disabled={disabled}
                          onClick={() => {
                            actionActions.addRewriteRule(index)
                          }}
                        />
                        <IconButton
                          icon="i-mgc-delete-2-cute-re"
                          className="hover:text-red"
                          ariaLabel={t("actions.action_card.summary.delete")}
                          disabled={disabled}
                          onClick={() => {
                            actionActions.deleteRewriteRule(index, rewriteIdx)
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ),
      },
      webhooks: {
        config: () => (
          <div className="flex flex-col gap-3">
            {!webhooks || webhooks.length === 0 ? (
              <button
                type="button"
                disabled={disabled}
                className="flex items-center justify-between rounded-lg bg-fill-quaternary px-4 py-3 text-xs text-text-tertiary transition-colors hover:bg-fill-tertiary hover:text-text disabled:opacity-50"
                onClick={() => {
                  actionActions.addWebhook(index)
                }}
              >
                <span>{t("actions.action_card.webhooks")}</span>
                <i className="i-mgc-add-cute-re" />
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                {webhooks.map((webhook, webhookIdx) => {
                  return (
                    <div
                      key={webhookIdx}
                      className="flex flex-col gap-2 rounded-lg bg-fill-quaternary p-4"
                    >
                      <Input
                        disabled={disabled}
                        value={webhook}
                        className="h-9"
                        placeholder="https://"
                        onChange={(event) => {
                          actionActions.updateWebhook({
                            index,
                            webhookIndex: webhookIdx,
                            value: event.target.value,
                          })
                        }}
                      />
                      <div className="flex items-center justify-end gap-2">
                        <IconButton
                          icon="i-mgc-add-cute-re"
                          ariaLabel={t("actions.action_card.add")}
                          disabled={disabled}
                          onClick={() => {
                            actionActions.addWebhook(index)
                          }}
                        />
                        <IconButton
                          icon="i-mgc-delete-2-cute-re"
                          className="hover:text-red"
                          ariaLabel={t("actions.action_card.summary.delete")}
                          disabled={disabled}
                          onClick={() => {
                            actionActions.deleteWebhook(index, webhookIdx)
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ),
      },
    })
    return Object.values(extendedAvailableActionMap)
  }, [disabled, index, rewriteRules, t, webhooks])

  const enabledActions = useMemo(() => {
    if (!result) return []

    // Get the order of actions from the result object (insertion order)
    const resultKeys = Object.keys(result).filter((key) => result[key as ActionId])

    // Sort availableActions based on the order in result object
    return resultKeys
      .map((key) => availableActions.find((action) => action.value === key))
      .filter((action): action is NonNullable<typeof action> => !!action)
  }, [availableActions, result])
  const notEnabledActions = useMemo(
    () => availableActions.filter((action) => !result?.[action.value]),
    [availableActions, result],
  )

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          {t("actions.action_card.then_do")}
        </span>
        {enabledActions.length > 0 && (
          <span className="text-xs text-text-secondary">
            {t("actions.action_card.summary.action_count", { count: enabledActions.length })}
          </span>
        )}
      </div>

      <div className="relative flex flex-col">
        {enabledActions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg bg-fill-quaternary px-4 py-6">
            <span className="text-xs text-text-secondary">
              {t("actions.action_card.summary.no_actions")}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={disabled}>
                <Button variant="outline" size="sm" buttonClassName="border-dashed">
                  <i className="i-mgc-add-cute-re mr-2" />
                  {t("actions.action_card.add")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-60">
                {notEnabledActions.map((action) => {
                  return (
                    <DropdownMenuItem
                      key={action.label}
                      onClick={() => {
                        if (action.onEnable) {
                          action.onEnable(index)
                        } else {
                          actionActions.patchRule(index, { result: { [action.value]: true } })
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <i className={action.iconClassname} />
                        {t(action.label)}
                      </div>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <>
            {enabledActions.map((action, actionIndex) => {
              const isLast = actionIndex === enabledActions.length - 1
              return (
                <Fragment key={action.label}>
                  <div className="relative flex gap-4">
                    {/* Connection line and icon */}
                    <div className="relative flex flex-col items-center pt-0.5">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-material-ultra-thick text-text shadow-sm">
                        <i className={cn(action.iconClassname, "text-base")} />
                      </div>
                      {!isLast && (
                        <div className="absolute left-1/2 top-9 h-[calc(100%+0.75rem)] w-0.5 -translate-x-1/2 bg-gradient-to-b from-fill-secondary to-transparent" />
                      )}
                    </div>

                    {/* Action content */}
                    <div className="flex min-w-0 flex-1 flex-col gap-3 pb-6 pt-0.5">
                      <div className="flex items-center gap-4">
                        {/* Label */}
                        <span className="flex h-9 items-center text-sm font-medium text-text">
                          {t(action.label)}
                        </span>

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Value selector or prefix element */}
                        {action.prefixElement && (
                          <div className="text-xs">{action.prefixElement}</div>
                        )}

                        {/* Settings button */}
                        {action.settingsPath && (
                          <Button
                            variant="outline"
                            size="sm"
                            buttonClassName="rounded-lg"
                            onClick={() => {
                              settingModalPresent(action.settingsPath)
                            }}
                          >
                            {t("actions.action_card.settings")}
                          </Button>
                        )}

                        {/* Delete button */}
                        <IconButton
                          icon="i-mgc-delete-2-cute-re"
                          ariaLabel={t("actions.action_card.summary.delete")}
                          disabled={disabled}
                          className="hover:text-red"
                          onClick={() => {
                            actionActions.deleteRuleAction(index, action.value)
                          }}
                        />
                      </div>
                      {action.config && (
                        <div className="rounded-lg bg-fill-quinary p-4">{action.config()}</div>
                      )}
                    </div>
                  </div>
                </Fragment>
              )
            })}
            <div className="relative flex gap-4">
              <div className="size-9 shrink-0" />
              <div className="pb-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={disabled}>
                    <Button variant="outline" size="sm" buttonClassName="border-dashed">
                      <i className="i-mgc-add-cute-re mr-2" />
                      {t("actions.action_card.add")}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-60">
                    {notEnabledActions.map((action) => {
                      return (
                        <DropdownMenuItem
                          key={action.label}
                          onClick={() => {
                            if (action.onEnable) {
                              action.onEnable(index)
                            } else {
                              actionActions.patchRule(index, { result: { [action.value]: true } })
                            }
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <i className={action.iconClassname} />
                            {t(action.label)}
                          </div>
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

const IconButton = ({
  icon,
  onClick,
  ariaLabel,
  disabled,
  className,
}: {
  icon: string
  onClick: () => void
  ariaLabel: string
  disabled?: boolean
  className?: string
}) => {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      className={cn(
        "flex size-6 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-fill-quaternary hover:text-text disabled:opacity-50",
        className,
      )}
      onClick={onClick}
    >
      <i className={icon} />
    </button>
  )
}
