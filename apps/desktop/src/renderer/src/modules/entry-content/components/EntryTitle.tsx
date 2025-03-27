import { cn, formatEstimatedMins, formatTimeToSeconds } from "@follow/utils/utils"
import dayjs from "dayjs"
import { useMemo } from "react"

import { useShowAITranslation } from "~/atoms/ai-translation"
import { useActionLanguage } from "~/atoms/settings/general"
import { useUISettingKey } from "~/atoms/settings/ui"
import { useWhoami } from "~/atoms/user"
import { RelativeTime } from "~/components/ui/datetime"
import { useAuthQuery } from "~/hooks/common"
import { FeedIcon } from "~/modules/feed/feed-icon"
import { Queries } from "~/queries"
import { useEntry, useEntryReadHistory } from "~/store/entry"
import { getPreferredTitle, useFeedById } from "~/store/feed"
import { useInboxById } from "~/store/inbox"

import { EntryTranslation } from "../../entry-column/translation"

interface EntryLinkProps {
  entryId: string
  compact?: boolean
}

const safeUrl = (url: string, baseUrl: string) => {
  try {
    return new URL(url, baseUrl).href
  } catch {
    return url
  }
}

export const EntryTitle = ({ entryId, compact }: EntryLinkProps) => {
  const user = useWhoami()
  const entry = useEntry(entryId)
  const feed = useFeedById(entry?.feedId)
  const inbox = useInboxById(entry?.inboxId)
  const entryHistory = useEntryReadHistory(entryId)

  const populatedFullHref = useMemo(() => {
    if (inbox) return entry?.entries.authorUrl
    const href = entry?.entries.url
    if (!href) return "#"

    if (href.startsWith("http")) return href
    const feedSiteUrl = feed?.type === "feed" ? feed.siteUrl : null
    if (href.startsWith("/") && feedSiteUrl) return safeUrl(href, feedSiteUrl)
    return href
  }, [entry?.entries.authorUrl, entry?.entries.url, feed?.siteUrl, feed?.type, inbox])

  const showAITranslation = useShowAITranslation() || !!entry?.settings?.translation
  const actionLanguage = useActionLanguage()

  const translation = useAuthQuery(
    Queries.ai.translation({
      entry: entry!,
      language: actionLanguage,
      extraFields: ["title"],
    }),
    {
      enabled: showAITranslation,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      meta: {
        persist: true,
      },
    },
  )

  const dateFormat = useUISettingKey("dateFormat")

  const dateRender = useMemo(() => {
    if (!entry?.entries.publishedAt) return null
    if (dateFormat === "default") return new Date(entry.entries.publishedAt).toLocaleString()
    return dayjs(entry.entries.publishedAt).format(dateFormat)
  }, [dateFormat, entry?.entries.publishedAt])

  const audioAttachment = useMemo(() => {
    return entry?.entries?.attachments?.find((a) => a.mime_type?.startsWith("audio") && a.url)
  }, [entry?.entries?.attachments])

  const estimatedMins = useMemo(() => {
    if (!audioAttachment?.duration_in_seconds) {
      return
    }

    let durationInSeconds = audioAttachment.duration_in_seconds

    if (Number.isNaN(+durationInSeconds)) {
      // @ts-expect-error durationInSeconds is string
      durationInSeconds = formatTimeToSeconds(durationInSeconds)
    }

    return formatEstimatedMins(Math.floor(durationInSeconds / 60))
  }, [audioAttachment])

  if (!entry) return null

  return compact ? (
    <div className="cursor-button @sm:-mx-3 @sm:p-3 -mx-6 flex items-center gap-2 rounded-lg p-6 transition-colors">
      <FeedIcon fallback feed={feed || inbox} entry={entry.entries} size={50} />
      <div className="leading-6">
        <div className="flex items-center gap-1 text-base font-semibold">
          <span>{entry.entries.author || feed?.title || inbox?.title}</span>
        </div>
        <div className="text-zinc-500">
          <RelativeTime date={entry.entries.publishedAt} />
        </div>
      </div>
    </div>
  ) : (
    <a
      href={populatedFullHref || void 0}
      target="_blank"
      draggable="false"
      className="cursor-button hover:bg-theme-item-hover focus-visible:bg-theme-item-hover @sm:-mx-3 @sm:p-3 block min-w-0 rounded-lg transition-colors focus-visible:!outline-none lg:-mx-6 lg:p-6"
      rel="noreferrer"
      onClick={(e) => {
        if (window.getSelection()?.toString()) {
          e.preventDefault()
        }
      }}
    >
      <div className={cn("select-text break-words font-bold", compact ? "text-2xl" : "text-3xl")}>
        <EntryTranslation
          showTranslation={showAITranslation}
          source={entry.entries.title}
          target={translation.data?.title}
          className="select-text hyphens-auto"
        />
      </div>
      <div className="mt-2 text-[13px] font-medium text-zinc-500">
        {getPreferredTitle(feed || inbox, entry.entries)}
      </div>
      <div className="flex select-none items-center gap-2 text-[13px] text-zinc-500">
        {dateRender}

        {estimatedMins && (
          <div className="flex items-center gap-1">
            <i className="i-mgc-time-cute-re" />
            <span>{estimatedMins}</span>
          </div>
        )}

        <div className="flex items-center gap-1">
          <i className="i-mgc-eye-2-cute-re" />
          <span>
            {(
              (entryHistory?.readCount ?? 0) +
              (entryHistory?.userIds?.every((id) => id !== user?.id) ? 1 : 0)
            ) // if no me, +1
              .toLocaleString()}
          </span>
        </div>
      </div>
    </a>
  )
}
