import { Spring } from "@follow/components/constants/spring.js"
import { useEntry } from "@follow/store/entry/hooks"
import { cn } from "@follow/utils/utils"
import * as Slider from "@radix-ui/react-slider"
import dayjs from "dayjs"
import { AnimatePresence, m } from "motion/react"
import { useCallback, useMemo, useState } from "react"

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

  // Slider drag state
  const [isDragging, setIsDragging] = useState(false)
  const [dragValue, setDragValue] = useState(0)

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

  const handleSliderValueChange = useCallback(
    (value: number[]) => {
      if (!isCurrentAudio || !displayHasValidDuration) return
      setDragValue(value[0]!)
    },
    [isCurrentAudio, displayHasValidDuration],
  )

  const handleSliderValueCommit = useCallback(
    (value: number[]) => {
      if (!isCurrentAudio || !displayHasValidDuration) return
      AudioPlayer.seek(value[0]!)
      setIsDragging(false)
    },
    [isCurrentAudio, displayHasValidDuration],
  )

  // Don't render if no audio attachment
  if (!audioAttachment) {
    return null
  }

  // Calculate slider value - use drag value when dragging, otherwise use current time
  const sliderValue = isDragging ? dragValue : displayCurrentTime
  const currentTimeDisplay = formatDuration(sliderValue)
  const durationDisplay = formatDuration(displayDuration)

  return (
    <AnimatePresence>
      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={Spring.presets.smooth}
        className={cn("relative my-4 w-full rounded-2xl border backdrop-blur-2xl", className)}
        style={{
          backgroundImage:
            "linear-gradient(to bottom right, rgba(var(--color-background) / 0.98), rgba(var(--color-background) / 0.95))",
          borderColor: "hsl(var(--fo-a) / 0.2)",
        }}
      >
        {/* Inner glow layer */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background:
              "linear-gradient(to bottom right, hsl(var(--fo-a) / 0.05), transparent, hsl(var(--fo-a) / 0.05))",
          }}
        />

        {/* Content */}
        <div className="relative p-5">
          {/* Control buttons and progress bar */}
          <div className="flex items-center gap-4">
            {/* Control buttons */}
            <div className="flex shrink-0 items-center gap-2">
              {/* Skip Back 10s */}
              <button
                type="button"
                onClick={handleBack}
                disabled={!isCurrentAudio}
                className={cn(
                  "group relative flex size-9 items-center justify-center rounded-full border",
                  "transition-all duration-300",
                  !isCurrentAudio && "cursor-not-allowed bg-transparent opacity-40",
                  isCurrentAudio &&
                    "hover:[background:linear-gradient(to_right,hsl(var(--fo-a)/0.08),hsl(var(--fo-a)/0.05))_!important] hover:[border-color:hsl(var(--fo-a)/0.25)_!important]",
                )}
                style={{
                  background: !isCurrentAudio
                    ? undefined
                    : "linear-gradient(to bottom right, rgba(var(--color-background) / 0.6), rgba(var(--color-background) / 0.4))",
                  borderColor: "hsl(var(--fo-a) / 0.15)",
                }}
                title="Back 10s"
              >
                <i className="i-mgc-back-2-cute-re size-4 text-text-secondary transition-colors group-hover:text-text" />
              </button>

              {/* Play/Pause Button */}
              <button
                type="button"
                onClick={handlePlayAudio}
                disabled={!audioAttachment}
                className={cn(
                  "group relative flex size-12 items-center justify-center rounded-full border",
                  "transition-all duration-300",
                  !audioAttachment && "cursor-not-allowed opacity-50",
                )}
                style={{
                  background:
                    "linear-gradient(135deg, hsl(var(--fo-a) / 0.9), hsl(var(--fo-a) / 0.75))",
                  borderColor: "hsl(var(--fo-a) / 0.4)",
                }}
                title={isPlaying ? "Pause" : "Play"}
              >
                {isLoading ? (
                  <i className="i-mgc-loading-3-cute-re size-6 animate-spin text-white" />
                ) : isPlaying ? (
                  <i className="i-mgc-pause-cute-fi size-6 text-white" />
                ) : (
                  <i className="i-mgc-play-cute-fi size-6 text-white" />
                )}
              </button>

              {/* Skip Forward 10s */}
              <button
                type="button"
                onClick={handleForward}
                disabled={!isCurrentAudio}
                className={cn(
                  "group relative flex size-9 items-center justify-center rounded-full border",
                  "transition-all duration-300",
                  !isCurrentAudio && "cursor-not-allowed bg-transparent opacity-40",
                  isCurrentAudio &&
                    "hover:[background:linear-gradient(to_right,hsl(var(--fo-a)/0.08),hsl(var(--fo-a)/0.05))_!important] hover:[border-color:hsl(var(--fo-a)/0.25)_!important]",
                )}
                style={{
                  background: !isCurrentAudio
                    ? undefined
                    : "linear-gradient(to bottom right, rgba(var(--color-background) / 0.6), rgba(var(--color-background) / 0.4))",
                  borderColor: "hsl(var(--fo-a) / 0.15)",
                }}
                title="Forward 10s"
              >
                <i className="i-mgc-forward-2-cute-re size-4 text-text-secondary transition-colors group-hover:text-text" />
              </button>
            </div>

            {/* Progress Bar Container */}
            <div className="flex-1">
              {displayHasValidDuration ? (
                <Slider.Root
                  className="group relative flex h-2.5 w-full touch-none select-none items-center"
                  min={0}
                  max={displayDuration}
                  step={0.1}
                  value={[sliderValue]}
                  disabled={!isCurrentAudio}
                  onPointerDown={() => {
                    if (isCurrentAudio) {
                      setIsDragging(true)
                      setDragValue(displayCurrentTime)
                    }
                  }}
                  onValueChange={handleSliderValueChange}
                  onValueCommit={handleSliderValueCommit}
                >
                  <Slider.Track className="relative h-2.5 w-full grow overflow-hidden rounded-full border border-fill bg-fill-secondary">
                    <Slider.Range className="absolute inset-y-0 rounded-full bg-accent" />
                  </Slider.Track>

                  <Slider.Thumb
                    className="block size-3.5 rounded-full border-2 border-white bg-accent opacity-0 transition-opacity focus-visible:opacity-100 focus-visible:outline-none group-hover:opacity-100"
                    aria-label="Progress"
                  />
                </Slider.Root>
              ) : (
                <div
                  className="relative h-2.5 w-full overflow-hidden rounded-full border"
                  style={{
                    background:
                      "linear-gradient(to right, hsl(var(--fo-a) / 0.1), hsl(var(--fo-a) / 0.08))",
                    borderColor: "hsl(var(--fo-a) / 0.15)",
                  }}
                />
              )}
            </div>

            {/* Time Display and Download */}
            <div className="flex shrink-0 items-center gap-3">
              <div className="flex gap-1.5 text-xs">
                <span className="font-mono text-text-secondary">{currentTimeDisplay}</span>
                <span className="text-text-tertiary">/</span>
                <span className="font-mono text-text-secondary">{durationDisplay}</span>
              </div>

              {/* Divider */}
              <div
                className="h-12 w-px"
                style={{
                  background:
                    "linear-gradient(to bottom, transparent, hsl(var(--fo-a) / 0.2), transparent)",
                }}
              />

              {/* Download Button */}
              <button
                type="button"
                onClick={handleDownload}
                className="group relative flex size-8 items-center justify-center rounded-full bg-transparent transition-all duration-300 hover:[background:linear-gradient(to_right,hsl(var(--fo-a)/0.08),hsl(var(--fo-a)/0.05))] hover:[border-color:hsl(var(--fo-a)/0.25)]"
                title="Download"
              >
                <i className="i-mgc-download-2-cute-re size-4 text-text-secondary transition-colors group-hover:text-text" />
              </button>
            </div>
          </div>
        </div>
      </m.div>
    </AnimatePresence>
  )
}
