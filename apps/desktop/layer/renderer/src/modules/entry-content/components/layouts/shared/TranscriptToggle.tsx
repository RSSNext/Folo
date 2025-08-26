import { SegmentGroup, SegmentItem } from "@follow/components/ui/segment/index.js"

interface TranscriptToggleProps {
  showTranscript: boolean
  onToggle: (showTranscript: boolean) => void
  hasTranscript: boolean
  contentLabel?: string
}

export const TranscriptToggle: React.FC<TranscriptToggleProps> = ({
  showTranscript,
  onToggle,
  hasTranscript,
  contentLabel = "Content",
}) => {
  if (!hasTranscript) return null

  return (
    <div className="mb-6 mt-4 flex items-center gap-2">
      <SegmentGroup
        value={showTranscript ? "transcript" : "content"}
        onValueChanged={(value) => onToggle(value === "transcript")}
      >
        <SegmentItem value="content" label={contentLabel} />
        <SegmentItem value="transcript" label="Transcript" />
      </SegmentGroup>
    </div>
  )
}
