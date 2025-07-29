import { useEntry } from "@follow/store/entry/hooks"
import { useFeedById } from "@follow/store/feed/hooks"
import { cn } from "@follow/utils/utils"

import { RelativeTime } from "~/components/ui/datetime"
import { parseSocialMedia } from "~/lib/parsers"
import type { FeedIconEntry } from "~/modules/feed/feed-icon"
import { FeedIcon } from "~/modules/feed/feed-icon"
import { FeedTitle } from "~/modules/feed/feed-title"

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
    const iconEntry: FeedIconEntry = {
      firstPhotoUrl,
      authorAvatar,
    }

    return {
      feedId,
      author,
      authorUrl,
      publishedAt,
      iconEntry,
      guid,
      url,
    }
  })

  const feed = useFeedById(entry?.feedId)

  if (!entry || !feed) return null

  const parsed = parseSocialMedia(entry.authorUrl || entry.url || entry.guid)

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showAvatar && (
        <FeedIcon
          fallback
          feed={feed}
          entry={entry.iconEntry}
          size={avatarSize}
          className="shrink-0"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 text-base">
          <span className="font-semibold">
            <FeedTitle feed={feed} title={entry.author || feed.title} />
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
