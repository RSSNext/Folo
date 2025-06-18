import { ActionButton, Button } from "@follow/components/ui/button/index.js"
import { Divider } from "@follow/components/ui/divider/index.js"
import { Input } from "@follow/components/ui/input/index.js"
import type { ActionId } from "@follow/models/types"
import type { ActionAction } from "@follow/store/action/constant"
import { useActionRule } from "@follow/store/action/hooks"
import { actionActions } from "@follow/store/action/store"
import { merge } from "es-toolkit/compat"
import { Fragment, useMemo } from "react"
import { useTranslation } from "react-i18next"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu/dropdown-menu.js"

import { useSettingModal } from "../settings/modal/use-setting-modal"
import { availableActionMap } from "./constants"

export const ThenSection = ({ index }: { index: number }) => {
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
        config?: () => React.ReactNode
      }
    > = merge(availableActionMap, {
      rewriteRules: {
        config: () => (
          <div className="flex flex-col gap-2">
            {!rewriteRules || rewriteRules.length === 0 ? (
              <div className="flex items-center justify-between rounded-lg border border-dashed p-3">
                <span className="text-muted-foreground text-sm">Add rewrite rules</span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  onClick={() => {
                    actionActions.addRewriteRule(index)
                  }}
                >
                  <i className="i-mgc-add-cute-re" />
                </Button>
              </div>
            ) : (
              <>
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
                    <div key={rewriteIdx} className="group/rewrite-item flex items-end gap-2">
                      <div className="w-full">
                        <label className="text-muted-foreground text-sm">
                          {t("actions.action_card.from")}
                        </label>
                        <Input
                          disabled={disabled}
                          value={rule.from}
                          className="h-8"
                          onChange={(e) => change("from", e.target.value)}
                        />
                      </div>
                      <div className="w-full">
                        <label className="text-muted-foreground text-sm">
                          {t("actions.action_card.to")}
                        </label>
                        <Input
                          disabled={disabled}
                          value={rule.to}
                          className="h-8"
                          onChange={(e) => change("to", e.target.value)}
                        />
                      </div>
                      <div className="text-text-secondary flex gap-1">
                        <ActionButton
                          disabled={disabled}
                          onClick={() => {
                            actionActions.addRewriteRule(index)
                          }}
                        >
                          <i className="i-mgc-add-cute-re" />
                        </ActionButton>
                        <ActionButton
                          disabled={disabled}
                          onClick={() => {
                            actionActions.deleteRewriteRule(index, rewriteIdx)
                          }}
                        >
                          <i className="i-mgc-delete-2-cute-re" />
                        </ActionButton>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        ),
      },
      webhooks: {
        config: () => (
          <div className="flex flex-col gap-2">
            {!webhooks || webhooks.length === 0 ? (
              <div className="flex items-center justify-between rounded-lg border border-dashed p-3">
                <span className="text-muted-foreground text-sm">Add webhooks</span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  onClick={() => {
                    actionActions.addWebhook(index)
                  }}
                >
                  <i className="i-mgc-add-cute-re" />
                </Button>
              </div>
            ) : (
              <>
                {webhooks.map((webhook, webhookIdx) => {
                  return (
                    <div key={webhookIdx} className="flex items-center gap-2">
                      <Input
                        disabled={disabled}
                        value={webhook}
                        className="h-8"
                        placeholder="https://"
                        onChange={(e) => {
                          actionActions.updateWebhook({
                            index,
                            webhookIndex: webhookIdx,
                            value: e.target.value,
                          })
                        }}
                      />
                      <div className="text-text-secondary flex gap-1">
                        <ActionButton
                          disabled={disabled}
                          onClick={() => {
                            actionActions.addWebhook(index)
                          }}
                        >
                          <i className="i-mgc-add-cute-re" />
                        </ActionButton>
                        <ActionButton
                          disabled={disabled}
                          onClick={() => {
                            actionActions.deleteWebhook(index, webhookIdx)
                          }}
                        >
                          <i className="i-mgc-delete-2-cute-re" />
                        </ActionButton>
                      </div>
                    </div>
                  )
                })}
              </>
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
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{t("actions.action_card.then_do")}</h2>
      <div className="flex flex-col gap-2 pl-2">
        {enabledActions.map((action, i) => {
          return (
            <Fragment key={action.label}>
              <div className="group/action relative flex flex-col gap-2 py-2">
                <div className="flex w-full items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <i className={action.iconClassname} />
                    <span className="shrink grow truncate font-medium">{t(action.label)}</span>
                    {action.prefixElement && <div className="ml-2">{action.prefixElement}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    {action.settingsPath && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          settingModalPresent(action.settingsPath)
                        }}
                      >
                        {t("actions.action_card.settings")}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      buttonClassName="opacity-0 group-hover/action:opacity-100"
                      disabled={disabled}
                      onClick={() => {
                        actionActions.deleteRuleAction(index, action.value)
                      }}
                    >
                      <i className="i-mgc-close-cute-re" />
                    </Button>
                  </div>
                </div>
                {action.config && <div className="pl-6">{action.config()}</div>}
              </div>
              {i !== enabledActions.length - 1 && <Divider className="my-1" />}
            </Fragment>
          )
        })}
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={disabled}>
            <Button variant="outline" buttonClassName="mt-2 w-full">
              <i className="i-mgc-add-cute-re mr-2" />
              {t("actions.action_card.add")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
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
  )
}
