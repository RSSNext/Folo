import type { SupportedLanguages } from "@follow/models/types"
import { cn } from "@follow/utils/utils"
import { useMemo } from "react"

import { useShowAITranslation } from "~/atoms/ai-translation"
import { useGeneralSettingSelector } from "~/atoms/settings/general"
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
  const translationLanguage = useGeneralSettingSelector((s) => s.translationLanguage)

  const translation = useAuthQuery(
    Queries.ai.translation({
      entry: entry!,
      language: entry?.settings?.translation || (translationLanguage as SupportedLanguages),
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

  if (!entry) return null

  return compact ? (
    <div className="-mx-6 flex cursor-button items-center gap-2 rounded-lg p-6 transition-colors @sm:-mx-3 @sm:p-3">
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
      className="block min-w-0 cursor-button rounded-lg transition-colors hover:bg-theme-item-hover focus-visible:bg-theme-item-hover focus-visible:!outline-none @sm:-mx-3 @sm:p-3 lg:-mx-6 lg:p-6"
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
        {entry.entries.publishedAt && new Date(entry.entries.publishedAt).toLocaleString()}

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
