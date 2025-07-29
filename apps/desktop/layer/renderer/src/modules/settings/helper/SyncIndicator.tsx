import { PhCloudCheck } from "@follow/components/icons/PhCloudCheck.jsx"
import { PhCloudWarning } from "@follow/components/icons/PhCloudWarning.jsx"
import { PhCloudX } from "@follow/components/icons/PhCloudX.jsx"
import { RootPortal } from "@follow/components/ui/portal/index.js"
import { Tooltip, TooltipContent, TooltipTrigger } from "@follow/components/ui/tooltip/index.jsx"
import { useIsOnline } from "@follow/hooks"
import { useEffect, useMemo, useRef } from "react"
import { useTranslation } from "react-i18next"

import { useAuthQuery } from "~/hooks/common"
import { settings } from "~/queries/settings"

import { useSettingContextSelector } from "../modal/hooks"
import { settingSyncQueue } from "./sync-queue"

export const SettingSyncIndicator = () => {
  const { t } = useTranslation()
  const { data: remoteSettings, isLoading } = useAuthQuery(settings.get(), {})
  const canSync = useSettingContextSelector((s) => s.canSync)

  const isOnline = useIsOnline()
  const onceRef = useRef(false)
  useEffect(() => {
    if (!isLoading && remoteSettings && !onceRef.current) {
      const hasSetting = JSON.stringify(remoteSettings.settings) !== "{}"
      onceRef.current = true
      if (hasSetting) {
        return
      }
      // Replace local to remote
      settingSyncQueue.replaceRemote()
    }
  }, [remoteSettings, isLoading])

  const metaInfo: {
    icon: React.FC<React.SVGProps<SVGSVGElement>>
    text: string
  } = useMemo(() => {
    switch (true) {
      case !isOnline: {
        return {
          icon: PhCloudX,
          text: t("sync_indicator.offline"),
        }
      }
      case !canSync: {
        return {
          icon: PhCloudWarning,
          text: t("sync_indicator.disabled"),
        }
      }
      default: {
        return {
          icon: PhCloudCheck,
          text: t("sync_indicator.synced"),
        }
      }
    }
  }, [isOnline, canSync, t])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="size-5">
          <metaInfo.icon className="size-4" />
        </div>
      </TooltipTrigger>
      <RootPortal>
        <TooltipContent>
          <div className="text-center text-xs">{metaInfo.text}</div>
        </TooltipContent>
      </RootPortal>
    </Tooltip>
  )
}
