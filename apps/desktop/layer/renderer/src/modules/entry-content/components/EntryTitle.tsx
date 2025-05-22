import { formatEstimatedMins, formatTimeToSeconds } from "@follow/utils/utils"
import { useMemo } from "react"
import { titleCase } from "title-case"

import { useUISettingKey } from "~/atoms/settings/ui"
import { useWhoami } from "~/atoms/user"
import { RelativeTime } from "~/components/ui/datetime"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { useFeedSafeUrl } from "~/hooks/common/useFeedSafeUrl"
import { FeedIcon } from "~/modules/feed/feed-icon"
import { useEntryTranslation } from "~/store/ai/hook"
import { useEntry, useEntryReadHistory } from "~/store/entry"
import { getPreferredTitle, useFeedById } from "~/store/feed"
import { useInboxById } from "~/store/inbox"

import { EntryTranslation } from "../../entry-column/translation"

interface EntryLinkProps {
  entryId: string
  compact?: boolean
}

export const EntryTitle = ({ entryId, compact }: EntryLinkProps) => {
  const user = useWhoami()
  const entry = useEntry(entryId)
  const feed = useFeedById(entry?.feedId)
  const inbox = useInboxById(entry?.inboxId)
  const entryHistory = useEntryReadHistory(entryId)
  const populatedFullHref = useFeedSafeUrl(entryId)
  const translation = useEntryTranslation({ entry, extraFields: ["title"] })

  const dateFormat = useUISettingKey("dateFormat")

  const audioAttachment = useMemo(() => {
    return entry?.entries?.attachments?.find((a) => a.mime_type?.startsWith("audio") && a.url)
  }, [entry?.entries?.attachments])

  const estimatedMins = useMemo(() => {
    if (!audioAttachment?.duration_in_seconds) {
      return
    }

    const durationInSeconds = formatTimeToSeconds(audioAttachment.duration_in_seconds)
    if (!durationInSeconds) {
      return
    }

    return formatEstimatedMins(Math.floor(durationInSeconds / 60))
  }, [audioAttachment])

  const navigateEntry = useNavigateEntry()

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
    <div className="group relative block min-w-0 rounded-lg">
      <div className="flex flex-col gap-3">
        <div>
          <a
            href={populatedFullHref ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-link hover:multi-[scale-[1.01];opacity-95] inline-block select-text break-words text-[1.7rem] font-bold leading-normal duration-200"
          >
            <EntryTranslation
              source={titleCase(entry.entries.title ?? "")}
              target={titleCase(translation.data?.title ?? "")}
              className="text-text inline-block select-text hyphens-auto duration-200"
              inline={false}
              bilingual
            />
          </a>
        </div>

        {/* Meta Information with improved layout */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <div className="text-text-secondary [&>div:hover]:multi-[text-text] flex flex-wrap items-center gap-4 [&>div]:transition-colors">
            <div
              className="flex items-center text-xs font-medium"
              onClick={() =>
                navigateEntry({
                  feedId: feed?.id,
                })
              }
            >
              <FeedIcon fallback feed={feed || inbox} entry={entry.entries} size={16} />
              {getPreferredTitle(feed || inbox, entry.entries)}
            </div>
            <div className="flex items-center gap-1.5">
              <i className="i-mgc-calendar-time-add-cute-re text-base" />
              <span className="text-xs tabular-nums">
                <RelativeTime date={entry.entries.publishedAt} dateFormatTemplate={dateFormat} />
              </span>
            </div>

            {estimatedMins && (
              <div className="flex items-center gap-1.5">
                <i className="i-mgc-time-cute-re text-base" />
                <span className="text-xs tabular-nums">{estimatedMins}</span>
              </div>
            )}

            {(() => {
              const readCount =
                (entryHistory?.readCount ?? 0) +
                (entryHistory?.userIds?.every((id) => id !== user?.id) ? 1 : 0)

              return readCount > 0 ? (
                <div className="flex items-center gap-1.5">
                  <i className="i-mgc-eye-2-cute-re text-base" />
                  <span className="text-xs tabular-nums">{readCount.toLocaleString()}</span>
                </div>
              ) : null
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
