import { useEntry } from "@follow/store/entry/hooks"

import { EntryTitle } from "../EntryTitle"
import { ContentBody } from "./shared/ContentBody"
import { VideoPlayer } from "./shared/VideoPlayer"

interface VideosLayoutProps {
  entryId: string
  compact?: boolean
  noMedia?: boolean
  translation?: {
    content?: string
    title?: string
  }
}

export const VideosLayout: React.FC<VideosLayoutProps> = ({
  entryId,
  compact = false,
  noMedia = false,
  translation,
}) => {
  const entry = useEntry(entryId, (state) => state)

  if (!entry) return null

  return (
    <div className="mx-auto flex h-full flex-col p-6">
      {/* Video player area */}
      <div className="mb-6 w-full">
        {!noMedia ? (
          <VideoPlayer
            entryId={entryId}
            showDuration={true}
            preferFullSize={true}
            translation={translation}
            className="w-full"
          />
        ) : (
          <div className="center bg-material-medium text-text-secondary aspect-video w-full flex-col gap-1 rounded-md text-sm">
            <i className="i-mgc-video-cute-fi mb-2 size-12" />
            Video content not available
          </div>
        )}
      </div>

      {/* Content area below video */}
      <div className="flex-1 space-y-4">
        {/* Title */}
        <EntryTitle entryId={entryId} compact={compact} />

        {/* Description/Content */}
        <ContentBody
          entryId={entryId}
          translation={translation}
          compact={compact}
          noMedia={true}
          className="text-base"
        />
      </div>
    </div>
  )
}
