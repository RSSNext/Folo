import { useGlobalFocusableScopeSelector } from "@follow/components/common/Focusable/index.js"
import { Spring } from "@follow/components/constants/spring.js"
import { useMobile } from "@follow/components/hooks/useMobile.js"
import { Tooltip, TooltipContent, TooltipTrigger } from "@follow/components/ui/tooltip/index.jsx"
import { FeedViewType } from "@follow/constants"
import { useEntry } from "@follow/store/entry/hooks"
import { useFeedById } from "@follow/store/feed/hooks"
import { useListById } from "@follow/store/list/hooks"
import { useSubscriptionByFeedId } from "@follow/store/subscription/hooks"
import { tracker } from "@follow/tracker"
import { EventBus } from "@follow/utils/event-bus"
import { cn } from "@follow/utils/utils"
import * as Slider from "@radix-ui/react-slider"
import dayjs from "dayjs"
import { AnimatePresence, m } from "motion/react"
import { useEffect, useMemo, useState } from "react"
import Marquee from "react-fast-marquee"
import { useTranslation } from "react-i18next"

import {
  AudioPlayer,
  getAudioPlayerAtomValue,
  useAudioPlayerAtomSelector,
  useAudioPlayerAtomValue,
} from "~/atoms/player"
import { FocusablePresets } from "~/components/common/Focusable"
import { VolumeSlider } from "~/components/ui/media/VolumeSlider"
import type { NavigateEntryOptions } from "~/hooks/biz/useNavigateEntry"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import type { FeedIconEntry } from "~/modules/feed/feed-icon"
import { FeedIcon } from "~/modules/feed/feed-icon"

import { COMMAND_ID } from "../command/commands/id"
import { useCommandBinding } from "../command/hooks/use-command-binding"

const handleClickPlay = () => {
  AudioPlayer.togglePlayAndPause()
}

const setNowPlaying = (metadata: MediaMetadataInit) => {
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata(metadata)
  }
}

interface ControlButtonProps {
  className?: string
  hideControls?: boolean
  rounded?: boolean
}

export const CornerPlayer = ({ className, ...rest }: ControlButtonProps) => {
  const show = useAudioPlayerAtomSelector((v) => v.show)
  const entryId = useAudioPlayerAtomSelector((v) => v.entryId)
  const entry = useEntry(entryId, (state) => ({ feedId: state.feedId }))
  const feed = useFeedById(entry?.feedId)

  return (
    <AnimatePresence>
      {show && entry && feed && (
        <m.div
          key="corner-player"
          className={cn("group relative z-10 !my-0 w-full pr-px", className)}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ ...Spring.presets.microRebound, duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          <CornerPlayerImpl {...rest} />
        </m.div>
      )}
    </AnimatePresence>
  )
}

const usePlayerTracker = () => {
  const playerOpenAt = useState(Date.now)[0]
  const show = useAudioPlayerAtomSelector((v) => v.show)

  useEffect(() => {
    const handler = () => {
      const playerState = getAudioPlayerAtomValue()

      tracker.playerOpenDuration({
        duration: Date.now() - playerOpenAt,
        status: playerState.status,
        trigger: "beforeunload",
      })
    }

    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [playerOpenAt])

  useEffect(() => {
    if (!show) {
      const playerState = getAudioPlayerAtomValue()
      tracker.playerOpenDuration({
        duration: Date.now() - playerOpenAt,
        status: playerState.status,
        trigger: "manual",
      })
    }
  }, [playerOpenAt, show])
}
const CornerPlayerImpl = ({ hideControls, rounded }: ControlButtonProps) => {
  const isMobile = useMobile()

  const { t } = useTranslation()
  const entryId = useAudioPlayerAtomSelector((v) => v.entryId)
  const status = useAudioPlayerAtomSelector((v) => v.status)
  const isMute = useAudioPlayerAtomSelector((v) => v.isMute)
  const listId = useAudioPlayerAtomSelector((v) => v.listId)

  const playerValue = { entryId, status, isMute }

  const entry = useEntry(playerValue.entryId, (state) => {
    const { feedId, inboxHandle } = state
    const { authorAvatar, id, title } = state

    const media = state.media || []
    const firstMedia = media[0]
    const firstPhoto = media.find((a) => a.type === "photo")
    const firstPhotoUrl = firstPhoto?.url
    const entryCoverImage = firstMedia?.preview_image_url || firstMedia?.url || firstPhotoUrl
    const iconEntry: FeedIconEntry = { firstPhotoUrl, authorAvatar }

    return {
      authorAvatar,
      feedId,
      iconEntry,
      id,
      inboxId: inboxHandle,
      title,
      entryCoverImage,
    }
  })
  const isInbox = !!entry?.inboxId
  const feed = useFeedById(entry?.feedId)
  const subscription = useSubscriptionByFeedId(entry?.feedId)
  const list = useListById(listId)

  useCommandBinding({
    commandId: COMMAND_ID.global.toggleCornerPlay,
    when: useGlobalFocusableScopeSelector(FocusablePresets.isSubscriptionOrTimeline),
  })

  useEffect(() => {
    return EventBus.subscribe(COMMAND_ID.global.toggleCornerPlay, () => {
      handleClickPlay()
    })
  }, [])

  useEffect(() => {
    const coverImage = entry?.entryCoverImage || feed?.image

    setNowPlaying({
      title: entry?.title || undefined,
      artist: feed?.title || undefined,
      album: coverImage || undefined,
      artwork: [
        {
          src: coverImage || "",
        },
      ],
    })
  }, [entry, feed])

  useEffect(() => {
    navigator.mediaSession.setActionHandler("play", handleClickPlay)
    navigator.mediaSession.setActionHandler("pause", handleClickPlay)

    return () => {
      navigator.mediaSession.setActionHandler("play", null)
      navigator.mediaSession.setActionHandler("pause", null)
    }
  }, [])

  const navigateToEntry = useNavigateEntry()
  usePlayerTracker()

  const navigateOptions = useMemo<NavigateEntryOptions | null>(() => {
    if (!entry) return null
    const options: NavigateEntryOptions = {
      entryId: entry.id,
    }
    if (isInbox) {
      Object.assign(options, {
        inboxId: entry?.feedId,
        view: FeedViewType.Articles,
      })
    } else if (list) {
      Object.assign(options, {
        listId: list.id,
        view: list.view,
      })
    } else if (feed) {
      Object.assign(options, {
        feedId: feed.id,
        view: subscription?.view ?? FeedViewType.Audios,
      })
    } else {
      return null
    }
    return options
  }, [entry, feed, isInbox, list, subscription?.view])
  const [pause, setPause] = useState(true)
  if (!entry || !feed) return null

  return (
    <>
      <div
        className={cn(
          "relative flex w-full border-y bg-white transition-all duration-200 ease-in-out dark:bg-neutral-800",
          rounded && "overflow-hidden rounded-lg border",
        )}
      >
        {/* play cover */}
        <div className="relative size-[3.625rem] shrink-0">
          <FeedIcon
            feed={feed}
            entry={entry.iconEntry}
            size={isMobile ? 65.25 : 58}
            fallback={false}
            noMargin
            useMedia
          />
          <div
            className={cn(
              "center absolute inset-0 w-full opacity-0 transition-all duration-200 ease-in-out",
              isMobile ? "opacity-100" : "group-hover:opacity-100",
            )}
          >
            <button
              type="button"
              className="center bg-theme-background hover:bg-accent size-10 rounded-full opacity-95 hover:text-white hover:opacity-100"
              onClick={handleClickPlay}
            >
              <i
                className={cn("size-6", {
                  "i-mgc-pause-cute-fi": playerValue.status === "playing",
                  "i-mgc-loading-3-cute-re animate-spin": playerValue.status === "loading",
                  "i-mgc-play-cute-fi": playerValue.status === "paused",
                })}
              />
            </button>
          </div>
        </div>

        <div className="relative grow truncate px-2 py-1 text-center text-sm">
          <Marquee
            play={playerValue.status === "playing" && pause}
            className="mask-horizontal font-medium"
            speed={30}
            gradient={false}
            onCycleComplete={() => {
              setPause(false)
              setTimeout(() => {
                setPause(true)
              }, 1000)
            }}
          >
            {`\u00A0\u00A0\u00A0\u00A0${entry.title}`}
          </Marquee>
          <div
            className={cn(
              "text-text-secondary mt-0.5 overflow-hidden truncate text-xs",
              !isMobile && "group-hover:opacity-0",
            )}
          >
            {feed.title}
          </div>

          {/* progress control */}
          <PlayerProgress />
        </div>
      </div>

      {/* advanced controls */}
      {!hideControls && (
        <div
          className={cn(
            "bg-theme-background absolute inset-x-0 top-0 z-[-1] flex justify-between border-t p-1 opacity-0 transition-all duration-200 ease-in-out",
            isMobile
              ? "-translate-y-full opacity-100"
              : "group-hover:-translate-y-full group-hover:opacity-100",
          )}
        >
          <div className="flex items-center">
            <ActionIcon
              className="i-mgc-close-cute-re"
              onClick={() => AudioPlayer.close()}
              label={t("player.close")}
            />
            <ActionIcon
              className="i-mgc-external-link-cute-re"
              onClick={() => {
                if (navigateOptions) {
                  navigateToEntry(navigateOptions)
                }
              }}
              label={t("player.open_entry")}
            />
            <ActionIcon
              label={t("player.download")}
              onClick={() => {
                window.open(AudioPlayer.get().src, "_blank")
              }}
            >
              <i className="i-mgc-download-2-cute-re" />
            </ActionIcon>
          </div>
          {/* audio control */}
          <div className="flex items-center">
            <ActionIcon label={<PlaybackRateSelector />} labelDelayDuration={0}>
              <PlaybackRateButton />
            </ActionIcon>
            <ActionIcon
              className={cn(
                playerValue.isMute
                  ? "i-mgc-volume-off-cute-re text-red-500"
                  : "i-mgc-volume-cute-re",
              )}
              onClick={() => AudioPlayer.toggleMute()}
              label={<CornerPlayerVolumeSlider />}
              labelDelayDuration={0}
            />
            <ActionIcon
              className="i-mgc-back-2-cute-re"
              onClick={() => AudioPlayer.back(10)}
              label={t("player.back_10s")}
            />
            <ActionIcon
              className="i-mgc-forward-2-cute-re"
              onClick={() => AudioPlayer.forward(10)}
              label={t("player.forward_10s")}
              tooltipAlign="end"
            />
          </div>
        </div>
      )}
    </>
  )
}

const ONE_HOUR_IN_SECONDS = 60 * 60
export const PlayerProgress = () => {
  const isMobile = useMobile()
  const playerValue = useAudioPlayerAtomValue()

  const { currentTime = 0, duration = 0 } = playerValue
  const [controlledCurrentTime, setControlledCurrentTime] = useState(currentTime)
  const [isDraggingProgress, setIsDraggingProgress] = useState(false)

  useEffect(() => {
    if (isDraggingProgress) return
    if (duration > 0 && currentTime >= duration) {
      AudioPlayer?.pause()
      AudioPlayer?.seek(duration)
      return
    }
    setControlledCurrentTime(currentTime)
  }, [currentTime, isDraggingProgress, duration])

  const getTimeIndicator = (time: number) => {
    return dayjs()
      .startOf("y")
      .second(time)
      .format(time > ONE_HOUR_IN_SECONDS ? "H:mm:ss" : "m:ss")
  }

  const currentTimeIndicator = getTimeIndicator(controlledCurrentTime)
  const remainingTimeIndicator = duration
    ? getTimeIndicator(duration - controlledCurrentTime)
    : null

  return (
    <div className="relative mt-2">
      <div
        className={cn(
          "text-theme-disabled absolute bottom-2 flex w-full items-center justify-between opacity-0 duration-150 ease-in-out",
          isMobile ? "opacity-100" : "group-hover:opacity-100",
        )}
      >
        <div className="text-xs">{currentTimeIndicator}</div>
        {!!remainingTimeIndicator && <div className="text-xs">-{remainingTimeIndicator}</div>}
      </div>

      {/* slider */}
      {!!duration && (
        <Slider.Root
          className="relative flex h-1 w-full items-center transition-all duration-200 ease-in-out"
          min={0}
          max={duration}
          step={1}
          value={[controlledCurrentTime]}
          onPointerDown={() => setIsDraggingProgress(true)}
          onPointerUp={() => setIsDraggingProgress(false)}
          onValueChange={(value) => setControlledCurrentTime(value[0]!)}
          onValueCommit={(value) => AudioPlayer.seek(value[0]!)}
        >
          <Slider.Track className="relative h-1 w-full grow rounded bg-gray-200 duration-200 group-hover:bg-gray-300 dark:bg-neutral-700 group-hover:dark:bg-neutral-600">
            <Slider.Range className="bg-accent/80 absolute h-1 rounded" />
          </Slider.Track>

          {/* indicator */}
          <Slider.Thumb
            className="bg-accent block h-2 w-[3px] rounded-[1px]"
            aria-label="Progress"
          />
        </Slider.Root>
      )}
    </div>
  )
}

const ActionIcon = ({
  className,
  onClick,
  label,
  labelDelayDuration = 700,
  tooltipAlign,
  children,
}: {
  className?: string
  onClick?: () => void
  label: React.ReactNode
  labelDelayDuration?: number
  tooltipAlign?: "center" | "end" | "start"
  children?: React.ReactNode
}) => (
  <Tooltip delayDuration={labelDelayDuration}>
    <TooltipTrigger
      className="center hover:bg-material-ultra-thick size-6 rounded-md text-zinc-500"
      onClick={onClick}
      asChild
    >
      <button type="button">{children || <i aria-hidden className={className} />}</button>
    </TooltipTrigger>
    <TooltipContent align={tooltipAlign}>{label}</TooltipContent>
  </Tooltip>
)

const CornerPlayerVolumeSlider = () => {
  const volume = useAudioPlayerAtomSelector((v) => v.volume)

  return <VolumeSlider volume={volume!} onVolumeChange={AudioPlayer.setVolume.bind(AudioPlayer)} />
}

const PlaybackRateSelector = () => {
  const playbackRate = useAudioPlayerAtomSelector((v) => v.playbackRate)

  return (
    <div className="flex flex-col items-center gap-0.5">
      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
        <button
          key={rate}
          type="button"
          className={cn(
            "center hover:bg-theme-item-hover rounded-md p-1 font-mono",
            playbackRate === rate && "bg-theme-item-hover text-text",
            playbackRate !== rate && "text-text-secondary",
          )}
          onClick={() => AudioPlayer.setPlaybackRate(rate)}
        >
          {rate.toFixed(2)}x
        </button>
      ))}
    </div>
  )
}

const PlaybackRateButton = () => {
  const playbackRate = useAudioPlayerAtomSelector((v) => v.playbackRate)

  const char = `${playbackRate || 1}`
  return (
    <span className={cn(char.length > 1 ? "text-[9px]" : "text-xs", "block font-mono")}>
      {char}x
    </span>
  )
}
