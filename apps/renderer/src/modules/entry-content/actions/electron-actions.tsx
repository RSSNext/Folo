import { ActionButton } from "@follow/components/ui/button/index.js"
import { DividerVertical } from "@follow/components/ui/divider/index.js"
import { FeedViewType, views } from "@follow/constants"
import type { CombinedEntryModel } from "@follow/models/types"
import { IN_ELECTRON } from "@follow/shared/constants"
import { cn } from "@follow/utils/utils"
import { noop } from "foxact/noop"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { AudioPlayer, getAudioPlayerAtomValue } from "~/atoms/player"
import {
  isInReadability,
  ReadabilityStatus,
  useEntryInReadabilityStatus,
} from "~/atoms/readability"
import { useGeneralSettingKey } from "~/atoms/settings/general"
import { shortcuts } from "~/constants/shortcuts"
import { useEntryReadabilityToggle } from "~/hooks/biz/useEntryActions"
import { tipcClient } from "~/lib/client"
import { parseHtml } from "~/lib/parse-html"
import type { FlatEntryModel } from "~/store/entry"
import { useFeedById } from "~/store/feed"

export const ElectronAdditionActions = IN_ELECTRON
  ? ({
      view = FeedViewType.Articles,
      entry,
    }: {
      view: FeedViewType
      entry?: FlatEntryModel | null
    }) => {
      const entryReadabilityStatus = useEntryInReadabilityStatus(entry?.entries.id)

      const { t } = useTranslation()

      const feed = useFeedById(entry?.feedId)

      const populatedEntry = useMemo(() => {
        if (!entry) return null
        if (!feed) return null
        return {
          ...entry,
          feeds: feed!,
        } as CombinedEntryModel
      }, [entry, feed])

      const readabilityToggle = useEntryReadabilityToggle({
        id: populatedEntry?.entries.id ?? "",
        url: populatedEntry?.entries.url ?? "",
      })

      const [ttsLoading, setTtsLoading] = useState(false)
      const voice = useGeneralSettingKey("voice")

      if (!populatedEntry) return null

      const items = [
        {
          key: "tts",
          name: t("entry_content.header.play_tts"),
          shortcut: shortcuts.entry.tts.key,
          className: ttsLoading ? "i-mgc-loading-3-cute-re animate-spin" : "i-mgc-voice-cute-re",

          disabled: !populatedEntry.entries.content,
          onClick: async () => {
            if (ttsLoading) return
            if (!populatedEntry.entries.content) return
            setTtsLoading(true)
            if (getAudioPlayerAtomValue().entryId === populatedEntry.entries.id) {
              AudioPlayer.togglePlayAndPause()
            } else {
              const filePath = await tipcClient?.tts({
                id: populatedEntry.entries.id,
                text: parseHtml(populatedEntry.entries.content).toText(),
                voice,
              })
              if (filePath) {
                AudioPlayer.mount({
                  type: "audio",
                  entryId: populatedEntry.entries.id,
                  src: `file://${filePath}`,
                  currentTime: 0,
                })
              }
            }
            setTtsLoading(false)
          },
        },
        {
          name: t("entry_content.header.readability"),
          className: cn(
            isInReadability(entryReadabilityStatus)
              ? `i-mgc-docment-cute-fi`
              : `i-mgc-docment-cute-re`,
            entryReadabilityStatus === ReadabilityStatus.WAITING ? `animate-pulse` : "",
          ),
          key: "readability",
          hide: views[view]!.wideMode || !populatedEntry.entries.url,
          active: isInReadability(entryReadabilityStatus),
          onClick: readabilityToggle,
        },
      ]

      if (items.length === 0) return null
      return (
        <>
          {items
            .filter((item) => !item.hide)
            .map((item) => (
              <ActionButton
                disabled={item.disabled}
                icon={<i className={item.className} />}
                active={item.active}
                shortcut={item.shortcut}
                onClick={item.onClick}
                tooltip={item.name}
                key={item.name}
              />
            ))}
          <DividerVertical className="mx-2 w-px" />
        </>
      )
    }
  : noop
