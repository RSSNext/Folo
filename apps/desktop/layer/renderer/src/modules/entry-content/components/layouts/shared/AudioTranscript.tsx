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

interface AudioTranscriptProps {
  className?: string
  srt: string | undefined
  entryId: string | undefined
  style?: React.CSSProperties
  /** Optional: number of consecutive subtitle lines to merge together (default: no merging) */
  mergeLines?: number
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
 * Parses SRT subtitle text and optionally merges consecutive lines
 * @param srtText - The SRT format text to parse
 * @param mergeLines - Optional number of consecutive subtitle items to merge together
 * @returns Array of parsed subtitle items
 */
function parseSrt(srtText: string, mergeLines?: number): SubtitleItem[] {
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

/**
 * Converts seconds to SRT time format (HH:MM:SS,mmm)
 * @param seconds - Time in seconds
 * @returns Time string in HH:MM:SS,mmm format
 */
function secondsToSrtTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const millisecs = Math.floor((seconds % 1) * 1000)

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")},${millisecs.toString().padStart(3, "0")}`
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

export const AudioTranscript: React.FC<AudioTranscriptProps> = ({
  className,
  style,
  srt,
  entryId,
  mergeLines,
}) => {
  // Get current playing time from the audio player
  const currentTime = useAudioPlayerAtomSelector((v) => v.currentTime) || 0
  const isPlaying = useAudioPlayerAtomSelector((v) => v.status === "playing")
  const status = useAudioPlayerAtomSelector((v) => v.status)
  const show = useAudioPlayerAtomSelector((v) => v.show)
  const playerEntryId = useAudioPlayerAtomSelector((v) => v.entryId)

  // Get the audio URL for this entry to support cross-audio jumping
  const entry = useEntry(entryId, (state) => ({
    audioUrl: state.attachments?.find((att) => att.mime_type?.startsWith("audio/"))?.url,
  }))

  // Check if the current playing audio matches this transcript's entry
  const isCurrentAudio = playerEntryId === entryId

  if (!srt) {
    return (
      <div className={cn("p-4 text-center text-gray-500 dark:text-gray-400", className)}>
        No transcript available
      </div>
    )
  }

  let subtitles: SubtitleItem[]
  try {
    subtitles = parseSrt(srt, mergeLines)
  } catch (error) {
    return (
      <div className={cn("p-4 text-center text-red-500", className)}>
        Error parsing transcript:{" "}
        <span>{error instanceof Error ? error.message : "Unknown error"}</span>
      </div>
    )
  }

  // Find the current active subtitle based on current time
  // Only show active state if this transcript matches the currently playing audio
  const currentSubtitleIndex = isCurrentAudio
    ? subtitles.findIndex(
        (subtitle) =>
          currentTime >= subtitle.startTimeInSeconds && currentTime <= subtitle.endTimeInSeconds,
      )
    : -1

  const handleTimeJump = (timeInSeconds: number) => {
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
    <div className={cn("space-y-6", className)} style={style}>
      {/* Audio Player Status */}
      {show && isCurrentAudio && (
        <div className="border-b border-gray-200 pb-4 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => AudioPlayer.togglePlayAndPause()}
              className="rounded border border-gray-300 px-3 py-1 text-sm transition-colors hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              {isPlaying ? "⏸️" : "▶️"}
            </button>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Audio Transcript - {formatTime(secondsToSrtTime(currentTime))}
            </div>
          </div>
        </div>
      )}

      {/* Transcript Content */}
      <div className="space-y-4">
        {subtitles.map((subtitle, index) => {
          const isActive = index === currentSubtitleIndex
          const isPast = isCurrentAudio && currentTime > subtitle.endTimeInSeconds

          return (
            <div
              key={subtitle.index}
              className={cn(
                "group cursor-pointer rounded-lg p-4 transition-all duration-300 ease-in-out",
                "hover:shadow-md active:scale-[0.98]",
                isActive
                  ? "border-2 border-blue-200 bg-blue-50 shadow-sm dark:border-blue-800 dark:bg-blue-900/20"
                  : "border border-transparent hover:border-gray-200 hover:bg-gray-50 dark:hover:border-gray-700 dark:hover:bg-gray-800/50",
                isPast && "opacity-70",
              )}
              onClick={() => handleTimeJump(subtitle.startTimeInSeconds)}
              title={`Jump to ${formatTime(subtitle.startTime)}`}
            >
              <div className="mb-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTimeJump(subtitle.startTimeInSeconds)
                  }}
                  className={cn(
                    "font-mono text-xs transition-colors",
                    "cursor-pointer rounded bg-gray-100 px-2 py-1 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700",
                    isActive
                      ? "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-300 dark:hover:bg-blue-700"
                      : "text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400",
                  )}
                  title="Jump to this time"
                >
                  {formatTime(subtitle.startTime)}
                </button>
                <span
                  className={cn(
                    "text-xs",
                    isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-400",
                  )}
                >
                  #{subtitle.index}
                </span>
                {isActive && (
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    • Playing
                  </span>
                )}
              </div>
              <div
                className={cn(
                  "text-sm leading-relaxed transition-colors",
                  "group-hover:text-blue-600 dark:group-hover:text-blue-400",
                  isActive && "font-medium text-gray-900 dark:text-gray-100",
                )}
              >
                {subtitle.text}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 pt-4 text-center text-xs text-gray-600 dark:border-gray-700 dark:text-gray-400">
        Audio transcript powered by AI transcription
      </div>
    </div>
  )
}
