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
  /** Type of transcript: 'subtitle' disables jump and progress tracking, 'transcription' enables all features */
  type?: "subtitle" | "transcription"
}

/**
 * Converts SRT time format (HH:MM:SS,mmm) to seconds
 * @param timeString - Time string in HH:MM:SS,mmm format
 * @returns Time in seconds
 */
function srtTimeToSeconds(timeString: string): number {
  const [hours, minutes, seconds] = timeString.split(":")
  if (!hours || !minutes || !seconds) return 0

  const [secs, millisecs] = seconds.split(",")
  if (!secs) return 0

  return (
    Number.parseInt(hours, 10) * 3600 +
    Number.parseInt(minutes, 10) * 60 +
    Number.parseInt(secs, 10) +
    Number.parseInt(millisecs || "0", 10) / 1000
  )
}

/**
 * Parses SRT subtitle text and returns all subtitles as individual items
 * @param srtText - The SRT format text to parse
 * @returns Array of parsed subtitle items
 */
function parseSrt(srtText: string): SubtitleItem[] {
  const blocks = srtText.trim().split(/\n\s*\n/)

  const subtitles = blocks.map((block) => {
    const lines = block.trim().split("\n")
    if (!lines[0] || !lines[1]) {
      throw new Error("Invalid SRT format: missing required lines")
    }

    const index = Number.parseInt(lines[0], 10)
    const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/)

    if (!timeMatch || !timeMatch[1] || !timeMatch[2]) {
      throw new Error("Invalid SRT format: invalid time format")
    }

    const startTime = timeMatch[1]
    const endTime = timeMatch[2]
    const text = lines.slice(2).join("\n")

    return {
      index,
      startTime,
      endTime,
      text,
      startTimeInSeconds: srtTimeToSeconds(startTime),
      endTimeInSeconds: srtTimeToSeconds(endTime),
    }
  })

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
      <div className={cn("text-text-secondary p-4 text-center", className)}>
        No transcript available
      </div>
    )
  }

  let subtitles: SubtitleItem[]
  try {
    subtitles = parseSrt(srt)
  } catch (error) {
    return (
      <div className={cn("p-4 text-center text-red-500", className)}>
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
    <div className={cn("flex flex-wrap gap-1 leading-relaxed", className)} style={style}>
      {subtitles.map((subtitle, index) => {
        const isActive = index === currentSubtitleIndex
        const isPast =
          !disableProgressTracking && isCurrentAudio && currentTime > subtitle.endTimeInSeconds

        return (
          <span
            key={subtitle.index}
            className={cn(
              "inline-block transition-all duration-300 ease-out",
              !disableJump && "cursor-pointer",
              isActive
                ? "bg-accent/20 text-accent rounded-md px-1 py-0.5 font-medium"
                : isPast
                  ? "text-text-tertiary"
                  : "text-text-secondary hover:text-text",
              !disableJump && !isActive && "hover:bg-fill-secondary/50 rounded-md px-1 py-0.5",
            )}
            onClick={() => !disableJump && handleTimeJump(subtitle.startTimeInSeconds)}
            title={!disableJump ? `Jump to ${formatTime(subtitle.startTime)}` : undefined}
          >
            {subtitle.text}
          </span>
        )
      })}
    </div>
  )
}
