import { Button } from "@follow/components/ui/button/index.js"
import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@follow/components/ui/tooltip/index.jsx"
import { useEffect } from "react"
import { Trans } from "react-i18next"
import { Link } from "react-router"
import { toast } from "sonner"

import { setAppMessagingToken, useAppMessagingToken } from "~/atoms/app"
import { useCurrentModal } from "~/components/ui/modal/stacked/hooks"
import { useI18n } from "~/hooks/common"
import { ipcServices } from "~/lib/client"
import { useMessaging, useTestMessaging } from "~/queries/messaging"

export const SettingNotifications = () => {
  const t = useI18n()
  const { isLoading, data } = useMessaging()
  const { dismiss } = useCurrentModal()

  const token = useAppMessagingToken()

  const testMessaging = useTestMessaging()

  useEffect(() => {
    ipcServices?.setting.getMessagingToken().then((credentials) => {
      setAppMessagingToken(credentials || null)
    })
  }, [])

  return (
    <section className="mt-4 space-y-6">
      {/* Info Section */}

      <p className="text-sm leading-relaxed text-text-secondary">
        <Trans
          ns="settings"
          i18nKey="notifications.info"
          components={{
            ActionsLink: (
              <Link
                className="font-medium text-accent underline-offset-2 hover:text-accent/80 hover:underline"
                to="/action"
                onClick={() => {
                  dismiss()
                }}
              />
            ),
          }}
        />
      </p>

      {/* Channels Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text">{t.settings("notifications.channel")}</h3>
          <span className="text-xs text-text-tertiary">
            <span>{data?.data?.length || 0}</span> <span>{t.common("words.items")}</span>
          </span>
        </div>

        <div className="relative min-h-[200px]">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <LoadingCircle size="large" />
            </div>
          )}

          {!isLoading && (!data?.data || data.data.length === 0) ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-material-medium py-12">
              <i className="i-mgc-notification-cute-re mb-3 text-4xl text-text-quaternary" />
              <p className="text-sm text-text-tertiary">No notification channels</p>
            </div>
          ) : (
            <ScrollArea.ScrollArea viewportClassName="max-h-[400px]">
              <div className="space-y-2">
                {data?.data?.map((row) => (
                  <div
                    key={row.channel}
                    className="group relative flex items-center gap-4 rounded-lg border border-border bg-background p-4 transition-all hover:border-border hover:bg-fill-secondary/30"
                  >
                    {/* Channel Info */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text">{row.channel}</span>
                        {row.token === token && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                            <i className="i-mgc-check-cute-re text-[10px]" />
                            {t.settings("notifications.current")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-fill px-2 py-0.5 font-mono text-xs text-text-secondary">
                          {row.token.slice(0, 8)}...{row.token.slice(-8)}
                        </code>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            buttonClassName="size-8 p-0"
                            onClick={() =>
                              testMessaging.mutate(
                                { channel: row.channel },
                                {
                                  onSuccess: () => {
                                    toast.success(t.settings("notifications.test_success"))
                                  },
                                },
                              )
                            }
                          >
                            <i className="i-mgc-finger-press-cute-re text-base" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipPortal>
                          <TooltipContent>{t.settings("notifications.test")}</TooltipContent>
                        </TooltipPortal>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea.ScrollArea>
          )}
        </div>
      </div>
    </section>
  )
}
