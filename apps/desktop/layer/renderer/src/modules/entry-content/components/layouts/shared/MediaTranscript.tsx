import { useEntry } from "@follow/store/entry/hooks"
import { cn } from "@follow/utils"
import { checkLanguage } from "@follow/utils/language"

import { AudioPlayer, useAudioPlayerAtomSelector } from "~/atoms/player"

const MAX_PARAGRAPH_LENGTH = 300

interface SubtitleItem {
  index: number
  startTime: string
  endTime: string
  text: string
  startTimeInSeconds: number
  endTimeInSeconds: number
}

interface MediaTranscriptProps {
  className?: string
  srt: string | undefined
  entryId: string | undefined
  style?: React.CSSProperties
  /** Type of transcript: 'subtitle' disables jump and progress tracking, 'transcription' enables all features */
  type?: "subtitle" | "transcription"
}

/**
 * Converts SRT time format (HH:MM:SS,mmm or HH:MM:SS.mmm) to seconds
 * @param timeString - Time string in HH:MM:SS,mmm or HH:MM:SS.mmm format
 * @returns Time in seconds
 */
function srtTimeToSeconds(timeString: string): number {
  const [hours, minutes, seconds] = timeString.split(":")
  if (!hours || !minutes || !seconds) return 0

  // Handle both comma and dot as decimal separator
  const [secs, millisecs] = seconds.split(/[,.]/)
  if (!secs) return 0

  return (
    Number.parseInt(hours, 10) * 3600 +
    Number.parseInt(minutes, 10) * 60 +
    Number.parseInt(secs, 10) +
    Number.parseInt(millisecs || "0", 10) / 1000
  )
}

/**
 * Converts seconds to SRT time format (HH:MM:SS,mmm)
 * @param seconds - Time in seconds
 * @returns Time string in SRT format
 */
function formatTimeString(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const millisecs = Math.floor((seconds % 1) * 1000)
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")},${millisecs.toString().padStart(3, "0")}`
}

/**
 * Processes English content by splitting into sentences and grouping by length
 */
function processEnglishContent(allText: string): string[] {
  // First, temporarily replace ellipsis with a placeholder to avoid splitting on them
  const textWithPlaceholders = allText.replaceAll(/\.{3,}/g, "___ELLIPSIS___")

  // Split on sentence endings
  const rawSentences = textWithPlaceholders
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => s.replaceAll("___ELLIPSIS___", "...")) // Restore ellipsis

  // Restore sentence endings by detecting the original punctuation
  const sentences = rawSentences.map((sentence) => {
    // If sentence already ends with ellipsis, don't add additional punctuation
    if (sentence.endsWith("...")) {
      return sentence
    }

    const sentenceInText = allText.indexOf(sentence)
    if (sentenceInText === -1) return `${sentence}.`

    const afterSentence = allText.charAt(sentenceInText + sentence.length)
    const endings = [".", "!", "?"]
    const foundEnding = endings.find((ending) => afterSentence === ending)

    return `${sentence}${foundEnding || "."}`
  })

  // Group sentences into paragraphs with reasonable length
  const paragraphs: string[] = []
  let currentParagraph = ""

  for (const sentence of sentences) {
    if (currentParagraph.length === 0) {
      currentParagraph = sentence
    } else if (currentParagraph.length + sentence.length + 1 <= MAX_PARAGRAPH_LENGTH) {
      currentParagraph = `${currentParagraph} ${sentence}`
    } else {
      // Current paragraph is getting too long, start a new one
      paragraphs.push(currentParagraph)
      currentParagraph = sentence
    }
  }

  // Don't forget the last paragraph
  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph)
  }

  return paragraphs
}

/**
 * Calculates timing for English content paragraphs using character position mapping
 */
function calculateEnglishTiming(
  paragraphs: string[],
  allText: string,
  originalSubtitles: SubtitleItem[],
): SubtitleItem[] {
  // Create character position mapping
  let charPosition = 0
  const charToSubtitleMap: Array<{ charStart: number; charEnd: number; subtitle: SubtitleItem }> =
    []

  originalSubtitles.forEach((subtitle) => {
    const textLength = subtitle.text.length
    charToSubtitleMap.push({
      charStart: charPosition,
      charEnd: charPosition + textLength,
      subtitle,
    })
    charPosition += textLength + 1 // +1 for the space we added when joining
  })

  const firstSubtitle = originalSubtitles[0]!
  const lastSubtitle = originalSubtitles.at(-1)!
  const reorganizedSubtitles: SubtitleItem[] = []
  let textPosition = 0

  paragraphs.forEach((paragraph, index) => {
    const paragraphStart = allText.indexOf(paragraph, textPosition)
    const paragraphEnd =
      paragraphStart !== -1 ? paragraphStart + paragraph.length : textPosition + paragraph.length
    const actualStart = paragraphStart !== -1 ? paragraphStart : textPosition
    const actualEnd = paragraphEnd

    // Find overlapping subtitles
    const overlappingSubtitles = charToSubtitleMap.filter(
      (mapping) =>
        (actualStart >= mapping.charStart && actualStart < mapping.charEnd) ||
        (actualEnd > mapping.charStart && actualEnd <= mapping.charEnd) ||
        (actualStart <= mapping.charStart && actualEnd >= mapping.charEnd),
    )

    let startTimeInSeconds: number
    let endTimeInSeconds: number

    if (overlappingSubtitles.length > 0) {
      const firstOverlapping = overlappingSubtitles[0]!
      const lastOverlapping = overlappingSubtitles.at(-1)!

      if (overlappingSubtitles.length === 1) {
        // Single subtitle: interpolate within it
        const sub = firstOverlapping.subtitle
        const subTextLength = sub.text.length
        const subDuration = sub.endTimeInSeconds - sub.startTimeInSeconds

        if (subTextLength > 0 && subDuration > 0) {
          const relativeStart = Math.max(0, actualStart - firstOverlapping.charStart)
          const relativeEnd = Math.min(subTextLength, actualEnd - firstOverlapping.charStart)
          const startRatio = relativeStart / subTextLength
          const endRatio = relativeEnd / subTextLength

          startTimeInSeconds = sub.startTimeInSeconds + startRatio * subDuration
          endTimeInSeconds = sub.startTimeInSeconds + endRatio * subDuration
        } else {
          startTimeInSeconds = sub.startTimeInSeconds
          endTimeInSeconds = sub.endTimeInSeconds
        }
      } else {
        // Multiple subtitles: interpolate across the range
        const firstOverlappingSub = firstOverlapping.subtitle
        const lastOverlappingSub = lastOverlapping.subtitle

        // Calculate the total character range across all overlapping subtitles
        const totalCharStart = firstOverlapping.charStart
        const totalCharEnd = lastOverlapping.charEnd
        const totalCharLength = totalCharEnd - totalCharStart
        const totalTimeDuration =
          lastOverlappingSub.endTimeInSeconds - firstOverlappingSub.startTimeInSeconds

        if (totalCharLength > 0 && totalTimeDuration > 0) {
          // Calculate relative positions within the total overlapping range
          const relativeStart = Math.max(0, actualStart - totalCharStart)
          const relativeEnd = Math.min(totalCharLength, actualEnd - totalCharStart)
          const startRatio = relativeStart / totalCharLength
          const endRatio = relativeEnd / totalCharLength

          startTimeInSeconds =
            firstOverlappingSub.startTimeInSeconds + startRatio * totalTimeDuration
          endTimeInSeconds = firstOverlappingSub.startTimeInSeconds + endRatio * totalTimeDuration
        } else {
          // Fallback to simple range if calculation fails
          startTimeInSeconds = firstOverlappingSub.startTimeInSeconds
          endTimeInSeconds = lastOverlappingSub.endTimeInSeconds
        }
      }
    } else {
      // Fallback: proportional calculation
      const totalTextLength = allText.length
      const totalDuration = lastSubtitle.endTimeInSeconds - firstSubtitle.startTimeInSeconds
      const startRatio = actualStart / totalTextLength
      const endRatio = actualEnd / totalTextLength

      startTimeInSeconds = firstSubtitle.startTimeInSeconds + startRatio * totalDuration
      endTimeInSeconds = firstSubtitle.startTimeInSeconds + endRatio * totalDuration
    }

    reorganizedSubtitles.push({
      index: index + 1,
      startTime: formatTimeString(startTimeInSeconds),
      endTime: formatTimeString(endTimeInSeconds),
      text: paragraph,
      startTimeInSeconds,
      endTimeInSeconds,
    })

    textPosition = actualEnd
  })

  return reorganizedSubtitles
}

/**
 * Parses SRT subtitle text with optional sentence reorganization
 * @param srtText - The SRT format text to parse
 * @returns Array of parsed subtitle items
 */
function parseSrt(srtText: string): SubtitleItem[] {
  // Split by double newlines (with optional whitespace) to separate subtitle blocks
  const blocks = srtText.trim().split(/\n\s*\n/)

  // First, parse all original subtitle blocks to extract text and timing info
  const originalSubtitles = blocks
    .map((block) => {
      const lines = block.trim().split("\n")

      // Skip empty blocks
      if (lines.length < 3 || !lines[0] || !lines[1]) {
        return null
      }

      const index = Number.parseInt(lines[0].trim(), 10)

      // Validate index
      if (Number.isNaN(index)) {
        return null
      }

      // More flexible time format matching (handles various SRT time formats)
      const timeMatch = lines[1].match(
        /(\d{1,2}:\d{2}:\d{2}[,.]?\d{0,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,.]?\d{0,3})/,
      )

      if (!timeMatch || !timeMatch[1] || !timeMatch[2]) {
        return null
      }

      // Normalize time format (replace . with , for consistency)
      const startTime = timeMatch[1].replace(".", ",")
      const endTime = timeMatch[2].replace(".", ",")

      // Join all text lines (from line 3 onwards) with newlines
      const text = lines.slice(2).join("\n").trim()

      // Skip if no text content
      if (!text) {
        return null
      }

      return {
        index,
        startTime,
        endTime,
        text,
        startTimeInSeconds: srtTimeToSeconds(startTime),
        endTimeInSeconds: srtTimeToSeconds(endTime),
      }
    })
    .filter((subtitle): subtitle is SubtitleItem => subtitle !== null)

  if (originalSubtitles.length === 0) {
    return []
  }

  // Combine all text with timing information
  const allText = originalSubtitles.map((sub) => sub.text).join(" ")

  // Check if content is English to determine processing strategy
  const isEnglish = checkLanguage({ content: allText, language: "en" })

  // For non-English content, return original subtitles without any processing
  if (!isEnglish) {
    return originalSubtitles
  }

  // For English content: split by sentences and reorganize
  const paragraphs = processEnglishContent(allText)

  // Get timing information from first and last subtitles
  const firstSubtitle = originalSubtitles[0]
  const lastSubtitle = originalSubtitles.at(-1)

  if (!firstSubtitle || !lastSubtitle) {
    return []
  }

  // For English content: use character position mapping for precise timing
  return calculateEnglishTiming(paragraphs, allText, originalSubtitles)
}

function formatTime(timeString: string): string {
  // Convert SRT time format (HH:MM:SS,mmm) to a more readable format
  const time = timeString.replace(",", ".")
  const [hours, minutes, seconds] = time.split(":")

  if (!hours || !minutes || !seconds) {
    return timeString
  }

  if (hours === "00") {
    const secondsPart = seconds.split(".")[0]
    return `${minutes}:${secondsPart}`
  }

  const secondsPart = seconds.split(".")[0]
  return `${hours}:${minutes}:${secondsPart}`
}

export const MediaTranscript: React.FC<MediaTranscriptProps> = ({
  className,
  style,
  srt,
  entryId,
  type = "transcription",
}) => {
  // Determine if jump and progress tracking should be disabled based on type
  const disableJump = type === "subtitle"
  const disableProgressTracking = type === "subtitle"

  // Get current playing time from the audio player
  const currentTime = useAudioPlayerAtomSelector((v) => v.currentTime) || 0
  const status = useAudioPlayerAtomSelector((v) => v.status)
  const playerEntryId = useAudioPlayerAtomSelector((v) => v.entryId)

  // Get the audio URL for this entry to support cross-audio jumping
  const entry = useEntry(entryId, (state) => ({
    audioUrl: state.attachments?.find((att) => att.mime_type?.startsWith("audio/"))?.url,
  }))

  // Check if the current playing audio matches this transcript's entry
  const isCurrentAudio = playerEntryId === entryId

  if (!srt) {
    return (
      <div className={cn("p-4 text-center text-text-secondary", className)}>
        No transcript available
      </div>
    )
  }

  let subtitles: SubtitleItem[]
  try {
    subtitles = parseSrt(srt)
  } catch (error) {
    return (
      <div className={cn("p-4 text-center text-red", className)}>
        Error parsing transcript:{" "}
        <span>{error instanceof Error ? error.message : "Unknown error"}</span>
      </div>
    )
  }

  // Find the current active subtitle based on current time
  // Only show active state if this transcript matches the currently playing audio and progress tracking is enabled
  const currentSubtitleIndex =
    !disableProgressTracking && isCurrentAudio
      ? subtitles.findIndex(
          (subtitle) =>
            currentTime >= subtitle.startTimeInSeconds && currentTime <= subtitle.endTimeInSeconds,
        )
      : -1

  const handleTimeJump = (timeInSeconds: number) => {
    if (disableJump) return

    if (isCurrentAudio) {
      // If this is the current audio, seek to the time
      AudioPlayer.seek(timeInSeconds)

      // If the audio was paused, resume playback
      if (status === "paused") {
        AudioPlayer.play()
      }
    } else {
      // If this is a different audio, mount the new audio and seek to the time
      if (entry?.audioUrl && entryId) {
        AudioPlayer.mount({
          entryId,
          src: entry.audioUrl,
          currentTime: timeInSeconds,
          type: "audio",
        })
        // mount() automatically starts playing, so no need to call play() here
      }
    }
  }

  return (
    <div className={cn("space-y-1", className)} style={style}>
      {subtitles.map((subtitle, index) => {
        const isActive = index === currentSubtitleIndex
        const isPast = isCurrentAudio && currentTime > subtitle.endTimeInSeconds

        return (
          <div
            key={subtitle.index}
            className={cn(
              "group relative rounded-lg border-l-4 px-3 py-2 transition-all duration-300 ease-out",
              !disableJump && "cursor-pointer",
              isActive
                ? "border-accent bg-accent/5 shadow-sm"
                : "border-transparent hover:bg-fill-secondary hover:shadow-sm",
              isPast && "opacity-50",
            )}
            onClick={() => !disableJump && handleTimeJump(subtitle.startTimeInSeconds)}
          >
            <div className="flex items-start gap-4">
              {/* Time indicator */}
              <div className="flex-shrink-0 translate-y-3">
                {!disableJump ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTimeJump(subtitle.startTimeInSeconds)
                    }}
                    className={cn(
                      "rounded-md px-2 py-1 font-mono text-xs leading-none transition-all duration-200",
                      isActive
                        ? "bg-accent/10 text-accent"
                        : "text-text-tertiary hover:bg-fill-tertiary hover:text-text-secondary",
                    )}
                    title="Jump to this time"
                  >
                    {formatTime(subtitle.startTime)}
                  </button>
                ) : (
                  <span
                    className={cn(
                      "rounded-md px-2 py-1 font-mono text-xs leading-none",
                      isActive ? "bg-accent/10 text-accent" : "bg-fill-tertiary text-text-tertiary",
                    )}
                  >
                    {formatTime(subtitle.startTime)}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm leading-relaxed transition-all duration-300",
                    isActive ? "text-text-secondary" : "text-text-secondary",
                    !disableJump && "group-hover:text-text",
                  )}
                >
                  {subtitle.text}
                </p>
              </div>

              {/* Active indicator */}
              {type === "transcription" && (
                <div className="flex w-6 flex-shrink-0 items-center justify-center">
                  {isActive && (
                    <div className="duration-300 animate-in fade-in slide-in-from-right-2">
                      <div className="size-2 animate-pulse rounded-full bg-accent shadow-sm" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
