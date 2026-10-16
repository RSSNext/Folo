import { useEntry } from "@follow/store/entry/hooks"
import { useFeedById } from "@follow/store/feed/hooks"
import { cn } from "@follow/utils/utils"
import { useMemo } from "react"

import { RelativeTime } from "~/components/ui/datetime"
import { parseEntrySocialMedia } from "~/lib/parsers"
import type { FeedIconEntry } from "~/modules/feed/feed-icon"
import { FeedIcon } from "~/modules/feed/feed-icon"
import { FeedTitle } from "~/modules/feed/feed-title"
import { useSocialAuthorTitle } from "~/modules/feed/social-author-title"

interface AuthorHeaderProps {
  entryId: string
  className?: string
  showAvatar?: boolean
  avatarSize?: number
}

export const AuthorHeader: React.FC<AuthorHeaderProps> = ({
  entryId,
  className,
  showAvatar = true,
  avatarSize = 40,
}) => {
  const entry = useEntry(entryId, (state) => {
    const { feedId, author, authorAvatar, authorUrl, publishedAt, guid, url } = state

    const media = state.media || []
    const photo = media.find((a) => a.type === "photo")
    const firstPhotoUrl = photo?.url

    return {
      feedId,
      author,
      authorAvatar,
      authorUrl,
      publishedAt,
      firstPhotoUrl,
      guid,
      url,
    }
  })
  const iconEntry: FeedIconEntry = useMemo(
    () => ({ firstPhotoUrl: entry?.firstPhotoUrl, authorAvatar: entry?.authorAvatar }),
    [entry?.authorAvatar, entry?.firstPhotoUrl],
  )

  const feed = useFeedById(entry?.feedId)
  const authorTitle = useSocialAuthorTitle({
    feedId: entry?.feedId,
    author: entry?.author,
    feedTitle: feed?.title,
  })

  if (!entry || !feed) return null

  const parsed = parseEntrySocialMedia(entry, feed)

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showAvatar && (
        <FeedIcon fallback target={feed} entry={iconEntry} size={avatarSize} className="shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 text-base">
          <span className="font-semibold">
            <FeedTitle feed={feed} title={authorTitle} />
          </span>
          {parsed?.type === "x" && <i className="i-mgc-twitter-cute-fi size-3 text-[#4A99E9]" />}
        </div>
        <div className="flex items-center gap-1 text-sm text-zinc-500">
          {parsed?.type === "x" && (
            <>
              <a
                href={`https://x.com/${parsed.meta.handle}`}
                target="_blank"
                className="hover:underline"
              >
                @{parsed.meta.handle}
              </a>
              <span>·</span>
            </>
          )}
          <RelativeTime date={entry.publishedAt} />
        </div>
      </div>
    </div>
  )
}
