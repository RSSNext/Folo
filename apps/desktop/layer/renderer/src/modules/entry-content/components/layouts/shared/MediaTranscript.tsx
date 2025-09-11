import { useEntry } from "@follow/store/entry/hooks"
import { cn } from "@follow/utils"

import { AudioPlayer, useAudioPlayerAtomSelector } from "~/atoms/player"

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
  /** Optional: number of consecutive subtitle lines to merge together (default: no merging) */
  mergeLines?: number
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
 * Parses SRT subtitle text and optionally merges consecutive lines
 * @param srtText - The SRT format text to parse
 * @param mergeLines - Optional number of consecutive subtitle items to merge together
 * @returns Array of parsed subtitle items
 */
function parseSrt(srtText: string, mergeLines?: number): SubtitleItem[] {
  // Split by double newlines (with optional whitespace) to separate subtitle blocks
  const blocks = srtText.trim().split(/\n\s*\n/)

  const subtitles = blocks
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

  // If mergeLines is specified and > 1, merge consecutive subtitles
  if (mergeLines && mergeLines > 1) {
    const mergedSubtitles: SubtitleItem[] = []

    for (let i = 0; i < subtitles.length; i += mergeLines) {
      const chunk = subtitles.slice(i, i + mergeLines)
      if (chunk.length === 0) continue

      const firstItem = chunk[0]
      const lastItem = chunk.at(-1)

      if (!firstItem || !lastItem) continue

      const mergedText = chunk.map((item) => item.text).join(" ")

      mergedSubtitles.push({
        index: Math.floor(i / mergeLines) + 1,
        startTime: firstItem.startTime,
        endTime: lastItem.endTime,
        text: mergedText,
        startTimeInSeconds: firstItem.startTimeInSeconds,
        endTimeInSeconds: lastItem.endTimeInSeconds,
      })
    }

    return mergedSubtitles
  }

  return subtitles
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
  mergeLines,
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
      <div className={cn("text-secondary p-4 text-center", className)}>No transcript available</div>
    )
  }

  let subtitles: SubtitleItem[]
  try {
    subtitles = parseSrt(srt, mergeLines)
  } catch (error) {
    return (
      <div className={cn("text-red p-4 text-center", className)}>
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
                ? "bg-accent/5 border-accent shadow-sm"
                : "hover:bg-fill-secondary border-transparent hover:shadow-sm",
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
                        ? "text-accent bg-accent/10"
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
                      isActive ? "text-accent bg-accent/10" : "bg-fill-tertiary text-text-tertiary",
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
                    <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                      <div className="bg-accent size-2 animate-pulse rounded-full shadow-sm" />
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
