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
      className="group relative flex w-full flex-col items-start justify-start overflow-hidden rounded-lg border border-border bg-material-thick/80 p-4 backdrop-blur-sm transition-colors hover:bg-theme-item-hover"
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
          <h3 className="line-clamp-2 flex-1 text-left font-semibold leading-tight text-text">
            {title || "Untitled Feed"}
          </h3>
        </div>
        <i className="i-mgc-external-link-cute-re ml-2 shrink-0 text-text-tertiary opacity-60 transition-opacity group-hover:opacity-100" />
      </div>

      {/* Description */}
      {description && (
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-text-secondary">
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
