import { Spring } from "@follow/components/constants/spring.js"
import { useEntry } from "@follow/store/entry/hooks"
import { cn } from "@follow/utils/utils"
import dayjs from "dayjs"
import { AnimatePresence, m } from "motion/react"
import { useCallback, useMemo } from "react"

import { AudioPlayer, useAudioPlayerAtomSelector } from "~/atoms/player"

interface AudioPlayerProps {
  entryId: string
  className?: string
}

// Helper function to format duration
const formatDuration = (seconds: number) => {
  if (!seconds || seconds === Infinity) return "0:00"
  const duration = dayjs.duration(seconds, "seconds")
  const hours = Math.floor(duration.asHours())
  const minutes = duration.minutes()
  const secs = duration.seconds()

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}

export const ArticleAudioPlayer: React.FC<AudioPlayerProps> = ({ entryId, className }) => {
  const entry = useEntry(entryId, (state) => ({
    attachments: state.attachments,
    feedId: state.feedId,
  }))

  // Find the first audio attachment
  const audioAttachment = useMemo(() => {
    return entry?.attachments?.find(
      (attachment) => attachment.mime_type?.startsWith("audio/") && attachment.url,
    )
  }, [entry?.attachments])

  const currentPlayingEntryId = useAudioPlayerAtomSelector((v) => v.entryId)
  const status = useAudioPlayerAtomSelector((v) => v.status)
  const currentTime = useAudioPlayerAtomSelector((v) => v.currentTime)
  const duration = useAudioPlayerAtomSelector((v) => v.duration)

  // Use attachment duration as fallback when player duration is not available
  const attachmentDuration = useMemo(() => {
    if (!audioAttachment?.duration_in_seconds) return 0
    const seconds = Number(audioAttachment.duration_in_seconds)
    return Number.isFinite(seconds) ? seconds : 0
  }, [audioAttachment?.duration_in_seconds])

  const isCurrentAudio = currentPlayingEntryId === entryId
  const isPlaying = isCurrentAudio && status === "playing"
  const isLoading = isCurrentAudio && status === "loading"

  const handlePlayAudio = useCallback(() => {
    if (!audioAttachment) return

    if (isCurrentAudio) {
      AudioPlayer.togglePlayAndPause()
    } else {
      AudioPlayer.mount({
        entryId,
        src: audioAttachment.url,
        type: "audio",
        currentTime: 0,
      })
    }
  }, [audioAttachment, entryId, isCurrentAudio])

  const handleDownload = useCallback(() => {
    if (!audioAttachment?.url) return
    window.open(audioAttachment.url, "_blank")
  }, [audioAttachment?.url])

  const handleBack = useCallback(() => {
    if (!isCurrentAudio) return
    AudioPlayer.back(10)
  }, [isCurrentAudio])

  const handleForward = useCallback(() => {
    if (!isCurrentAudio) return
    AudioPlayer.forward(10)
  }, [isCurrentAudio])

  // Only show progress for current audio, otherwise reset to 0
  const displayCurrentTime = isCurrentAudio ? currentTime || 0 : 0
  // Use player duration first, fallback to attachment duration, then 0
  const displayDuration = isCurrentAudio
    ? duration && duration > 0 && duration !== Infinity
      ? duration
      : attachmentDuration
    : attachmentDuration || 0
  const displayHasValidDuration =
    displayDuration && displayDuration > 0 && displayDuration !== Infinity

  const handleProgressClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!isCurrentAudio || !displayHasValidDuration) return

      const rect = event.currentTarget.getBoundingClientRect()
      const clickX = event.clientX - rect.left
      const progressPercent = clickX / rect.width
      const newTime = progressPercent * displayDuration

      AudioPlayer.seek(newTime)
    },
    [isCurrentAudio, displayHasValidDuration, displayDuration],
  )

  const currentTimeDisplay = formatDuration(displayCurrentTime)
  const durationDisplay = formatDuration(displayDuration)

  // Don't render if no audio attachment
  if (!audioAttachment) {
    return null
  }

  const progressPercent = displayHasValidDuration ? (displayCurrentTime / displayDuration) * 100 : 0

  return (
    <AnimatePresence>
      <m.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={Spring.presets.smooth}
        className={cn(
          "rounded-lg border border-border bg-theme-background p-4 shadow-sm",
          "my-4 w-full",
          className,
        )}
      >
        {/* Control buttons and progress bar */}
        <div className="flex items-center gap-3">
          {/* Control buttons */}
          <div className="flex shrink-0 items-center gap-1">
            {/* Skip Back 10s */}
            <button
              type="button"
              onClick={handleBack}
              disabled={!isCurrentAudio}
              className={cn(
                "flex size-8 items-center justify-center rounded-full transition-colors hover:bg-theme-item-hover",
                !isCurrentAudio && "cursor-not-allowed opacity-50",
              )}
              title="Back 10s"
            >
              <i className="i-mgc-back-2-cute-re size-4" />
            </button>

            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={handlePlayAudio}
              disabled={!audioAttachment}
              className={cn(
                "flex size-10 items-center justify-center rounded-full bg-accent text-white transition-all duration-200 hover:bg-accent/90",
                "shadow-md hover:shadow-lg",
                !audioAttachment && "cursor-not-allowed opacity-50",
              )}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isLoading ? (
                <i className="i-mgc-loading-3-cute-re size-5 animate-spin" />
              ) : isPlaying ? (
                <i className="i-mgc-pause-cute-fi size-5" />
              ) : (
                <i className="i-mgc-play-cute-fi size-5" />
              )}
            </button>

            {/* Skip Forward 10s */}
            <button
              type="button"
              onClick={handleForward}
              disabled={!isCurrentAudio}
              className={cn(
                "flex size-8 items-center justify-center rounded-full transition-colors hover:bg-theme-item-hover",
                !isCurrentAudio && "cursor-not-allowed opacity-50",
              )}
              title="Forward 10s"
            >
              <i className="i-mgc-forward-2-cute-re size-4" />
            </button>
          </div>

          {/* Progress Bar Container */}
          <div className="flex-1">
            <div
              className="group h-2 w-full cursor-pointer rounded-full bg-border"
              onClick={handleProgressClick}
            >
              <div
                className="relative h-full rounded-full bg-accent transition-all duration-200"
                style={{ width: `${progressPercent}%` }}
              >
                {/* Hover indicator */}
                <div className="absolute right-0 top-1/2 size-4 -translate-y-1/2 translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="size-full rounded-full bg-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Time Display and Download */}
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex gap-1 text-xs">
              <span className="font-mono text-text-secondary">{currentTimeDisplay}</span>
              <span className="text-text-secondary">/</span>
              <span className="font-mono text-text-secondary">{durationDisplay}</span>
            </div>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="flex size-7 items-center justify-center rounded-full text-text-secondary transition-colors hover:text-text"
              title="Download"
            >
              <i className="i-mgc-download-2-cute-re size-3.5" />
            </button>
          </div>
        </div>
      </m.div>
    </AnimatePresence>
  )
}
