import { ActionButton, Button } from "@follow/components/ui/button/index.js"
import { Divider } from "@follow/components/ui/divider/index.js"
import { Input } from "@follow/components/ui/input/index.js"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@follow/components/ui/table/index.jsx"
import type { ActionId } from "@follow/models/types"
import type { ActionAction } from "@follow/store/action/constant"
import { availableActionMap } from "@follow/store/action/constant"
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
} from "~/components/ui/dropdown-menu/dropdown-menu"

import { useSettingModal } from "../settings/modal/use-setting-modal"

const AddTableRow = ({ onClick, disabled }: { onClick?: () => void; disabled?: boolean }) => {
  const { t } = useTranslation("settings")
  return (
    <Button
      variant="outline"
      textClassName="w-full"
      buttonClassName="py-1 mt-1 gap-1 w-full"
      onClick={onClick}
      disabled={disabled}
    >
      {t("actions.action_card.add")}
    </Button>
  )
}

const DeleteTableCell = ({ disabled, onClick }: { disabled?: boolean; onClick?: () => void }) => (
  <TableCell size="sm" className="flex h-10 items-center">
    <ActionButton disabled={disabled} onClick={onClick}>
      <i className="i-mgc-delete-2-cute-re text-zinc-600" />
    </ActionButton>
  </TableCell>
)

export const TargetActionList = ({ index }: { index: number }) => {
  const result = useActionRule(index, (a) => a.result)

  const rewriteRules = useActionRule(index, (a) => a.result.rewriteRules)
  const webhooks = useActionRule(index, (a) => a.result.webhooks)
  const settingModalPresent = useSettingModal()

  const disabled = useActionRule(index, (a) => a.result.disabled)
  const { t } = useTranslation("settings")

  const availableActions = useMemo(() => {
    const extendedAvailableActionMap: Record<
      ActionId,
      ActionAction & {
        config?: () => React.ReactNode
        configInline?: boolean
      }
    > = merge(availableActionMap, {
      rewriteRules: {
        config: () => (
          <>
            <Table className="mt-2">
              <TableHeader>
                <TableRow>
                  <TableHead size="sm">{t("actions.action_card.from")}</TableHead>
                  <TableHead size="sm">{t("actions.action_card.to")}</TableHead>
                  <TableHead size="sm" className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rewriteRules?.map((rule, rewriteIdx) => {
                  const change = (key: "from" | "to", value: string) => {
                    actionActions.updateRewriteRule({
                      index,
                      rewriteRuleIndex: rewriteIdx,
                      key,
                      value,
                    })
                  }
                  return (
                    <TableRow key={rewriteIdx}>
                      <TableCell size="sm">
                        <Input
                          disabled={disabled}
                          value={rule.from}
                          className="h-8"
                          onChange={(e) => change("from", e.target.value)}
                        />
                      </TableCell>
                      <TableCell size="sm">
                        <Input
                          disabled={disabled}
                          value={rule.to}
                          className="h-8"
                          onChange={(e) => change("to", e.target.value)}
                        />
                      </TableCell>
                      <DeleteTableCell
                        disabled={disabled}
                        onClick={() => {
                          actionActions.deleteRewriteRule(index, rewriteIdx)
                        }}
                      />
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <AddTableRow
              disabled={disabled}
              onClick={() => {
                actionActions.addRewriteRule(index)
              }}
            />
          </>
        ),
      },
      webhooks: {
        config: () => (
          <>
            {webhooks?.map((webhook, webhookIdx) => {
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
                  <DeleteTableCell
                    disabled={disabled}
                    onClick={() => {
                      actionActions.deleteWebhook(index, webhookIdx)
                    }}
                  />
                </div>
              )
            })}
            <AddTableRow
              disabled={disabled}
              onClick={() => {
                actionActions.addWebhook(index)
              }}
            />
          </>
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
    <div className="w-full shrink grow space-y-4">
      <p className="font-medium text-zinc-500">{t("actions.action_card.then_do")}</p>
      <div className="relative w-full space-y-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={disabled}>
            <ActionButton className="hover:text-text absolute right-0 top-0 -translate-y-11 text-zinc-500 duration-200">
              <i className="i-mgc-add-cute-re" />
            </ActionButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="left" align="start">
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

        <section className="pl-6">
          {enabledActions.map((action, index) => {
            return (
              <Fragment key={action.label}>
                <div className="group/action mt-3 flex w-full items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className={action.iconClassname} />
                    <span className="shrink grow truncate">{t(action.label)}</span>
                    {action.settingsPath && (
                      <Button
                        buttonClassName="ml-4"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          settingModalPresent(action.settingsPath)
                        }}
                      >
                        {t("actions.action_card.settings")}
                      </Button>
                    )}
                  </div>
                  {action.configInline && action.config && action.config()}

                  <Button
                    buttonClassName="absolute opacity-100 group-hover/action:opacity-70 hover:!opacity-100 duration-200 lg:opacity-0 left-0 z-[1] size-5 rounded-full border"
                    variant={"ghost"}
                    disabled={disabled}
                    onClick={() => {
                      actionActions.deleteRuleAction(index, action.value)
                    }}
                  >
                    <i className="i-mgc-close-cute-re size-3" />
                  </Button>
                </div>
                {!action.configInline && action.config && action.config()}
                {index !== enabledActions.length - 1 && <Divider className="my-2" />}
              </Fragment>
            )
          })}
        </section>
      </div>
    </div>
  )
}
