import { useEntry } from "@follow/store/entry/hooks"
import { transformVideoUrl } from "@follow/utils/url-for-video"

import { ArticleLayout } from "./ArticleLayout"
import { PicturesLayout } from "./PicturesLayout"
import type { EntryLayoutProps } from "./types"
import { VideosLayout } from "./VideosLayout"

export const MediaLayout: React.FC<EntryLayoutProps> = (props) => {
  const entry = useEntry(props.entryId, (state) => ({
    media: state.media,
    id: state.id,
    url: state.url,
    attachments: state.attachments,
  }))

  if (!entry) return null

  // Detect media types - more comprehensive video detection
  const hasVideoMedia = entry.media?.some((media) => media.type === "video")
  const hasVideoUrl =
    transformVideoUrl({
      url: entry.url ?? "",
      isIframe: true,
      attachments: entry.attachments,
    }) !== null
  const hasVideo = hasVideoMedia || hasVideoUrl
  const hasImages = entry.media?.some((media) => media.type === "photo")

  // Video has absolute priority - show video whenever it exists, regardless of noMedia
  const shouldShowVideo = hasVideo
  const shouldShowImages = !hasVideo && hasImages && !props.noMedia

  if (shouldShowVideo) {
    // Use VideosLayout for video content
    return <VideosLayout {...props} noMedia={false} />
  }

  if (shouldShowImages) {
    // Use PicturesLayout for image content
    return <PicturesLayout {...props} />
  }

  // Fallback: use ArticleLayout when no media content is detected
  return <ArticleLayout {...props} />
}
