import { SegmentGroup, SegmentItem } from "@follow/components/ui/segment/index.js"
import { useTranslation } from "react-i18next"

interface TranscriptToggleProps {
  showTranscript: boolean
  onToggle: (showTranscript: boolean) => void
  hasTranscript: boolean
}

export const TranscriptToggle: React.FC<TranscriptToggleProps> = ({
  showTranscript,
  onToggle,
  hasTranscript,
}) => {
  const { t } = useTranslation()
  if (!hasTranscript) return null

  return (
    <div className="mb-6 mt-4 flex items-center gap-2">
      <SegmentGroup
        value={showTranscript ? "transcript" : "content"}
        onValueChanged={(value) => onToggle(value === "transcript")}
      >
        <SegmentItem value="content" label={t("entry_content.transcript.tab_content")} />
        <SegmentItem value="transcript" label={t("entry_content.transcript.tab_transcript")} />
      </SegmentGroup>
    </div>
  )
}
