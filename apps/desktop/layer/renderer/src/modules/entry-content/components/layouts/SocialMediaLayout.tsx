import { useEntry } from "@follow/store/entry/hooks"
import { useFeedById } from "@follow/store/feed/hooks"
import { cn } from "@follow/utils/utils"

import { readableContentMaxWidthClassName } from "~/constants/ui"
import { SocialMediaGallery } from "~/modules/entry-column/Items/social-media-item"

import { AuthorHeader } from "./shared/AuthorHeader"
import { ContentBody } from "./shared/ContentBody"

interface SocialMediaLayoutProps {
  entryId: string
  compact?: boolean
  noMedia?: boolean
  translation?: {
    content?: string
    title?: string
  }
}

export const SocialMediaLayout: React.FC<SocialMediaLayoutProps> = ({
  entryId,
  compact = false,
  noMedia = false,
  translation,
}) => {
  const entry = useEntry(entryId, (state) => ({ feedId: state.feedId, media: state.media }))
  const feed = useFeedById(entry?.feedId)

  if (!entry || !feed) return null

  return (
    <div className={cn(readableContentMaxWidthClassName, "mx-auto space-y-5")}>
      {/* Single Author header without avatar */}
      <AuthorHeader entryId={entryId} />

      {/* Main content - direct ContentBody usage without show more logic */}
      <ContentBody
        entryId={entryId}
        translation={translation}
        compact={compact}
        className="text-base leading-relaxed"
        noMedia={true}
      />

      {/* Media gallery */}
      {!noMedia && <SocialMediaGallery entryId={entryId} />}
    </div>
  )
}
