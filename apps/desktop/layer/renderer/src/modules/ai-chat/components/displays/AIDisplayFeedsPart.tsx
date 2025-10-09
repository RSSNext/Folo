import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { FeedIcon } from "~/modules/feed/feed-icon"

import type { AIDisplayFeedTool } from "../../store/types"
import { withDisplayStateHandler } from "./share"

const AIDisplayFeedPartBase = ({
  input,
  output,
}: {
  input: NonNullable<AIDisplayFeedTool["input"]>
  output: NonNullable<AIDisplayFeedTool["output"]>
}) => {
  const { title, description, image, siteUrl } = output
  const { feedId } = input

  const navigateEntry = useNavigateEntry()
  const handleUrlClick = (e: React.MouseEvent) => {
    e.preventDefault()
    navigateEntry({ feedId })
  }

  return (
    <button
      type="button"
      onClick={handleUrlClick}
      className="bg-material-thick/80 border-border hover:bg-theme-item-hover group relative flex w-full flex-col items-start justify-start overflow-hidden rounded-lg border p-4 backdrop-blur-sm transition-colors"
    >
      {/* Header */}
      <div className="flex w-full items-start justify-between">
        <div className="flex">
          <FeedIcon
            disableFadeIn
            target={{
              type: "feed",
              title,

              image,
              siteUrl,
            }}
            siteUrl={siteUrl!}
          />
          <h3 className="text-text line-clamp-2 flex-1 text-left font-semibold leading-tight">
            {title || "Untitled Feed"}
          </h3>
        </div>
        <i className="i-mgc-external-link-cute-re text-text-tertiary ml-2 shrink-0 opacity-60 transition-opacity group-hover:opacity-100" />
      </div>

      {/* Description */}
      {description && (
        <p className="text-text-secondary mt-2 line-clamp-3 text-sm leading-relaxed">
          {description}
        </p>
      )}
    </button>
  )
}

export const AIDisplayFeedPart = withDisplayStateHandler<AIDisplayFeedTool["output"]>({
  title: "Feeds",
  loadingDescription: "Fetching feed data...",
  errorTitle: "Feeds Error",
})(AIDisplayFeedPartBase)
