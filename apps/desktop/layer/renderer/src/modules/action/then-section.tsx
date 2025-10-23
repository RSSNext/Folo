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

export const ThenSection = ({ index, variant = "detail" }: ThenSectionProps) => {
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
                className="flex items-center justify-between rounded-2xl border border-dashed border-fill-secondary/60 bg-material-ultra-thin/80 px-4 py-3 text-xs text-text-tertiary transition-colors hover:border-fill-secondary/80 hover:text-text disabled:opacity-50"
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
                      className="flex flex-col gap-3 rounded-2xl border border-fill-secondary/40 bg-material-ultra-thin/80 p-4"
                    >
                      <div className="grid gap-3 @[520px]:grid-cols-2">
                        <label className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                          {t("actions.action_card.from")}
                          <Input
                            disabled={disabled}
                            value={rule.from}
                            className="mt-2 h-9"
                            onChange={(event) => change("from", event.target.value)}
                          />
                        </label>
                        <label className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
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
                className="flex items-center justify-between rounded-2xl border border-dashed border-fill-secondary/60 bg-material-ultra-thin/80 px-4 py-3 text-xs text-text-tertiary transition-colors hover:border-fill-secondary/80 hover:text-text disabled:opacity-50"
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
                      className="flex flex-col gap-2 rounded-2xl border border-fill-secondary/40 bg-material-ultra-thin/80 p-4"
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

  const enabledActions = useMemo(
    () => availableActions.filter((action) => !!result?.[action.value]),
    [availableActions, result],
  )
  const notEnabledActions = useMemo(
    () => availableActions.filter((action) => !result?.[action.value]),
    [availableActions, result],
  )

  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-fill-secondary/40 bg-material-ultra-thin/80 p-4 shadow-sm",
        variant === "compact" && "bg-material-ultra-thin/70",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          {t("actions.action_card.then_do")}
        </span>
        {enabledActions.length > 0 && (
          <span className="text-xs text-text-tertiary">
            {t("actions.action_card.summary.action_count", { count: enabledActions.length })}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {enabledActions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-fill-secondary/60 bg-fill-tertiary/40 px-4 py-6 text-center text-xs text-text-tertiary">
            {t("actions.action_card.summary.no_actions")}
          </div>
        ) : (
          enabledActions.map((action) => {
            return (
              <Fragment key={action.label}>
                <div className="flex flex-col gap-3 rounded-2xl border border-fill-secondary/40 bg-fill-tertiary/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-text">
                      <span className="flex size-9 items-center justify-center rounded-full bg-fill-quaternary text-text-tertiary">
                        <i className={cn(action.iconClassname, "text-base")} />
                      </span>
                      <span className="text-sm font-medium">{t(action.label)}</span>
                      {action.prefixElement && (
                        <div className="ml-1 text-xs text-text-tertiary">
                          {action.prefixElement}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {action.settingsPath && (
                        <Button
                          variant="outline"
                          size="sm"
                          buttonClassName="rounded-full"
                          onClick={() => {
                            settingModalPresent(action.settingsPath)
                          }}
                        >
                          {t("actions.action_card.settings")}
                        </Button>
                      )}
                      <IconButton
                        icon="i-mgc-delete-2-cute-re"
                        ariaLabel={t("actions.action_card.summary.delete")}
                        disabled={disabled}
                        onClick={() => {
                          actionActions.deleteRuleAction(index, action.value)
                        }}
                      />
                    </div>
                  </div>
                  {action.config && (
                    <div className="rounded-2xl border border-fill-secondary/30 bg-material-ultra-thin/80 p-4">
                      {action.config()}
                    </div>
                  )}
                </div>
              </Fragment>
            )
          })
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={disabled}>
            <Button
              variant="outline"
              buttonClassName="w-full justify-center border-dashed border-fill-secondary/60"
            >
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
    </section>
  )
}

const IconButton = ({
  icon,
  onClick,
  ariaLabel,
  disabled,
}: {
  icon: string
  onClick: () => void
  ariaLabel: string
  disabled?: boolean
}) => {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      className="flex size-9 items-center justify-center rounded-full border border-fill-secondary/40 text-text-tertiary transition-colors hover:border-fill-secondary hover:text-text disabled:opacity-50"
      onClick={onClick}
    >
      <i className={icon} />
    </button>
  )
}
