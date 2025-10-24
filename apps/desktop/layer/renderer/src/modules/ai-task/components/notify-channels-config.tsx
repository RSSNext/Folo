import { Switch } from "@follow/components/ui/switch/index.jsx"
import { cn } from "@follow/utils"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import type { AITaskOptions } from "../types"

interface NotifyChannelsConfigProps {
  value: AITaskOptions["notifyChannels"]
  onChange: (channels: AITaskOptions["notifyChannels"]) => void
}

// Currently backend only supports 'email'. Using a single switch; easy to extend later.
const EMAIL_CHANNEL = {
  key: "email",
  icon: "i-mgc-mail-cute-re",
  labelKey: "tasks.notify.email",
  helperKey: "tasks.notify.email_helper",
} as const

export const NotifyChannelsConfig = ({ value, onChange }: NotifyChannelsConfigProps) => {
  const { t } = useTranslation("ai")

  const enabled = value.includes(EMAIL_CHANNEL.key)
  const toggle = useCallback(
    (checked: boolean) => {
      if (checked) onChange([EMAIL_CHANNEL.key])
      else onChange([])
    },
    [onChange],
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-md border p-3 text-sm">
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center gap-1 font-medium text-text">
            <i className={cn("size-4 text-text-secondary", EMAIL_CHANNEL.icon)} />
            {t(EMAIL_CHANNEL.labelKey)}
          </div>
          <div className="text-xs leading-relaxed text-text-tertiary">
            {t(EMAIL_CHANNEL.helperKey)}
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={toggle} />
      </div>
    </div>
  )
}

NotifyChannelsConfig.displayName = "NotifyChannelsConfig"
