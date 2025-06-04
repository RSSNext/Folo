import { Button } from "@follow/components/ui/button/index.js"
import { Divider } from "@follow/components/ui/divider/index.js"
import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@follow/components/ui/table/index.jsx"
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
    <section className="mt-4">
      <div className="mb-4 space-y-2 text-sm">
        <p>
          <Trans
            ns="settings"
            i18nKey="notifications.info"
            components={{
              ActionsLink: (
                <Link
                  className="underline"
                  to="/action"
                  onClick={() => {
                    dismiss()
                  }}
                />
              ),
            }}
          />
        </p>
      </div>
      <Divider className="mb-6 mt-8" />
      <div className="flex flex-1 flex-col">
        {isLoading && <LoadingCircle size="large" className="center absolute inset-0" />}

        <ScrollArea.ScrollArea viewportClassName="max-h-[380px]">
          <div className="overflow-auto">
            <Table className="mt-4">
              <TableHeader>
                <TableRow className="[&_*]:!font-semibold">
                  <TableHead size="sm">{t.settings("notifications.channel")}</TableHead>
                  <TableHead size="sm">{t.settings("notifications.token")}</TableHead>
                  <TableHead size="sm" className="center">
                    {t.common("words.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="border-t-[12px] border-transparent [&_td]:!px-3">
                {data?.data?.map((row) => (
                  <TableRow key={row.channel} className="h-8">
                    <TableCell size="sm">{row.channel}</TableCell>
                    <TableCell size="sm" className="truncate">
                      {row.token.slice(0, 6)}...{row.token.slice(-6)}
                      {row.token === token && ` ${t.settings("notifications.current")}`}
                    </TableCell>
                    <TableCell size="sm" className="center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
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
                            <i className="i-mgc-finger-press-cute-re" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipPortal>
                          <TooltipContent>{t.settings("notifications.test")}</TooltipContent>
                        </TooltipPortal>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ScrollArea.ScrollArea>
      </div>
    </section>
  )
}
