import { useEntry } from "@follow/store/entry/hooks"
import { cn } from "@follow/utils/utils"

import { usePreviewMedia } from "~/components/ui/media/hooks"
import { SwipeMedia } from "~/components/ui/media/SwipeMedia"
import { readableContentMaxWidthClassName } from "~/constants/ui"

import { AuthorHeader, ContentBody } from "./shared"

interface PicturesLayoutProps {
  entryId: string
  compact?: boolean
  noMedia?: boolean
  translation?: {
    content?: string
    title?: string
  }
}

export const PicturesLayout: React.FC<PicturesLayoutProps> = ({
  entryId,
  compact = false,
  noMedia = false,
  translation,
}) => {
  const entry = useEntry(entryId, (state) => ({ media: state.media, id: state.id }))
  const previewMedia = usePreviewMedia()

  if (!entry) return null

  return (
    <div className="group mx-auto max-w-4xl space-y-6 p-6">
      {!noMedia && (
        <SwipeMedia
          media={entry?.media || []}
          className={cn("aspect-square", "w-full shrink-0 rounded-md [&_img]:rounded-md")}
          imgClassName="object-contain"
          onPreview={previewMedia}
          proxySize={null}
        />
      )}

      {/* Single Author header without avatar */}
      <AuthorHeader entryId={entryId} className={cn("mx-auto", readableContentMaxWidthClassName)} />

      {/* Text Content Section */}
      <ContentBody
        entryId={entryId}
        translation={translation}
        compact={compact}
        noMedia={true}
        className="mx-auto"
      />
    </div>
  )
}
