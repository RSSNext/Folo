import { useEntry } from "@follow/store/entry/hooks"
import { useState } from "react"

import { EntryTitle } from "../EntryTitle"
import { ContentBody, MediaTranscript, TranscriptToggle, useTranscription } from "./shared"
import { VideoPlayer } from "./shared/VideoPlayer"
import type { EntryLayoutProps } from "./types"

export const VideosLayout: React.FC<EntryLayoutProps> = ({
  entryId,
  compact = false,
  noMedia = false,
  translation,
}) => {
  const entry = useEntry(entryId, (state) => state)
  const { data: transcriptionData } = useTranscription(entryId)
  const [showTranscript, setShowTranscript] = useState(false)

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
          <div className="center aspect-video w-full flex-col gap-1 rounded-md bg-material-medium text-sm text-text-secondary">
            <i className="i-mgc-video-cute-fi mb-2 size-12" />
            Video content not available
          </div>
        )}
      </div>

      {/* Content area below video */}
      <div className="flex-1 space-y-4">
        {/* Title */}
        <EntryTitle entryId={entryId} compact={compact} />

        {/* Content Type Toggle */}
        <TranscriptToggle
          showTranscript={showTranscript}
          onToggle={setShowTranscript}
          hasTranscript={!!transcriptionData}
        />

        {/* Description/Content or Transcript */}
        {showTranscript ? (
          <MediaTranscript
            className="prose !max-w-full dark:prose-invert"
            srt={transcriptionData}
            entryId={entryId}
            type="subtitle"
          />
        ) : (
          <ContentBody
            entryId={entryId}
            translation={translation}
            compact={compact}
            noMedia={true}
            className="text-base"
          />
        )}
      </div>
    </div>
  )
}
