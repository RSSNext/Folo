"~/components/common/Focusable.js"
import { Spring } from "@follow/components/constants/spring.js"
import { ActionButton, MotionButtonBase } from "@follow/components/ui/button/index.js"
import type { HTMLMediaState } from "@follow/hooks"
import { useRefValue, useVideo } from "@follow/hooks"
import { nextFrame, stopPropagation } from "@follow/utils/dom"
import { clsx, cn } from "@follow/utils/utils"
import * as Slider from "@radix-ui/react-slider"
import { m, useDragControls, useSpring } from "motion/react"
import type { PropsWithChildren, RefObject } from "react"
import {
  memo,
  startTransition,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react"
import { useHotkeys } from "react-hotkeys-hook"
import { useTranslation } from "react-i18next"
import { createContext, useContext, useContextSelector } from "use-context-selector"
import { useEventCallback } from "usehooks-ts"

import { AudioPlayer } from "~/atoms/player"
import { Focusable } from "~/components/common/Focusable"
import { IconScaleTransition } from "~/components/ux/transition/icon"
import { HotkeyScope } from "~/constants"

import { VolumeSlider } from "./VolumeSlider"

type VideoPlayerProps = {
  src: string

  variant?: "preview" | "player" | "thumbnail"
} & React.VideoHTMLAttributes<HTMLVideoElement> &
  PropsWithChildren
export type VideoPlayerRef = {
  getElement: () => HTMLVideoElement | null

  getState: () => HTMLMediaState
  controls: {
    play: () => Promise<void> | undefined
    pause: () => void
    seek: (time: number) => void
    volume: (volume: number) => void
    mute: () => void
    unmute: () => void
  }

  wrapperRef: RefObject<HTMLDivElement | null>
}

interface VideoPlayerContextValue {
  state: HTMLMediaState
  controls: VideoPlayerRef["controls"]
  wrapperRef: RefObject<HTMLDivElement | null>
  src: string
  variant: "preview" | "player" | "thumbnail"
}
const VideoPlayerContext = createContext<VideoPlayerContextValue>(null!)
export const VideoPlayer = ({
  ref,
  src,
  className,
  variant = "player",
  ...rest
}: VideoPlayerProps & {
  ref?: React.Ref<VideoPlayerRef | null> | ((ref: VideoPlayerRef) => void)
}) => {
  const isPlayer = variant === "player"
  const [clickToStatus, setClickToStatus] = useState(null as "play" | "pause" | null)

  const scaleValue = useSpring(1, Spring.presets.softSpring)
  const opacityValue = useSpring(0, Spring.presets.softSpring)
  const handleClick = useEventCallback((e?: any) => {
    if (!isPlayer) return
    e?.stopPropagation()

    if (state.playing) {
      controls.pause()
      setClickToStatus("pause")
    } else {
      controls.play()
      setClickToStatus("play")
    }

    opacityValue.jump(1)
    scaleValue.jump(1)

    nextFrame(() => {
      scaleValue.set(1.3)
      opacityValue.set(0)
    })
  })

  const [element, state, controls, videoRef] = useVideo({
    src,
    className,
    playsInline: true,
    ...rest,
    controls: false,
    onClick(e) {
      rest.onClick?.(e)
      handleClick(e)
    },
    muted: isPlayer ? false : true,
    onDoubleClick(e) {
      rest.onDoubleClick?.(e)
      if (!isPlayer) return
      e.preventDefault()
      e.stopPropagation()
      if (!document.fullscreenElement) {
        wrapperRef.current?.requestFullscreen()
      } else {
        document.exitFullscreen()
      }
    },
  })

  useHotkeys("space", (e) => {
    e.preventDefault()
    handleClick()
  })

  const stateRef = useRefValue(state)
  const memoedControls = useState(controls)[0]
  const wrapperRef = useRef<HTMLDivElement>(null)
  useImperativeHandle(
    ref,
    () => ({
      getElement: () => videoRef.current,
      getState: () => stateRef.current,
      controls: memoedControls,
      wrapperRef,
    }),

    [stateRef, videoRef, memoedControls],
  )

  return (
    <Focusable
      className="center group relative size-full"
      ref={wrapperRef}
      scope={HotkeyScope.VideoPlayer}
    >
      {element}
      <div className="center pointer-events-none absolute inset-0">
        <m.div
          className="center flex size-20 rounded-full bg-black p-3"
          style={{ scale: scaleValue, opacity: opacityValue }}
        >
          <i
            className={cn(
              "size-8 text-white",
              clickToStatus === "play" ? "i-mgc-play-cute-fi" : "i-mgc-pause-cute-fi",
            )}
          />
        </m.div>
      </div>
      {state.hasAudio && !state.muted && state.playing && <BizControlOutsideMedia />}
      {/* eslint-disable-next-line @eslint-react/no-context-provider */}
      <VideoPlayerContext.Provider
        value={useMemo(
          () => ({ state, controls, wrapperRef, src, variant }),
          [state, controls, src, variant],
        )}
      >
        {variant === "preview" && state.hasAudio && <FloatMutedButton />}
        {isPlayer && <ControlBar />}
      </VideoPlayerContext.Provider>
    </Focusable>
  )
}
const BizControlOutsideMedia = () => {
  const currentAudioPlayerIsPlayRef = useMemo(() => AudioPlayer.get().status === "playing", [])
  useEffect(() => {
    if (currentAudioPlayerIsPlayRef) {
      AudioPlayer.pause()
    }

    return () => {
      if (currentAudioPlayerIsPlayRef) {
        AudioPlayer.play()
      }
    }
  }, [currentAudioPlayerIsPlayRef])

  return null
}

const FloatMutedButton = () => {
  // eslint-disable-next-line @eslint-react/no-use-context
  const ctx = useContext(VideoPlayerContext)
  const isMuted = ctx.state.muted
  return (
    <MotionButtonBase
      className="center absolute right-4 top-4 z-10 size-7 rounded-full bg-black/50 opacity-0 duration-200 group-hover:opacity-100"
      onClick={(e) => {
        e.stopPropagation()
        if (isMuted) {
          ctx.controls.unmute()
        } else {
          ctx.controls.mute()
        }
      }}
    >
      <IconScaleTransition
        className="size-4 text-white"
        icon1="i-mgc-volume-cute-re"
        icon2="i-mgc-volume-mute-cute-re"
        status={isMuted ? "done" : "init"}
      />
    </MotionButtonBase>
  )
}

const ControlBar = memo(() => {
  const { t } = useTranslation()
  const controls = useContextSelector(VideoPlayerContext, (v) => v.controls)
  const isPaused = useContextSelector(VideoPlayerContext, (v) => v.state.paused)
  const dragControls = useDragControls()

  return (
    <m.div
      onClick={stopPropagation}
      drag
      dragListener={false}
      dragControls={dragControls}
      dragElastic={0}
      dragMomentum={false}
      dragConstraints={{ current: document.documentElement }}
      className={cn(
        "bg-material-thick backdrop-blur-background border-border absolute inset-x-2 bottom-2 h-8 rounded-2xl border",
        "flex items-center gap-3 px-3",
        "mx-auto max-w-[80vw]",
      )}
    >
      {/* Drag Area */}
      <div
        onPointerDownCapture={dragControls.start.bind(dragControls)}
        className="absolute inset-0 z-[1]"
      />

      <ActionIcon
        shortcut="Space"
        label={isPaused ? t("player.play") : t("player.pause")}
        className="center relative flex"
        onClick={() => {
          if (isPaused) {
            controls.play()
          } else {
            controls.pause()
          }
        }}
      >
        <span className="center">
          <IconScaleTransition
            status={isPaused ? "init" : "done"}
            icon1="i-mgc-play-cute-fi"
            icon2="i-mgc-pause-cute-fi"
          />
        </span>
      </ActionIcon>

      {/* Progress bar */}
      <PlayProgressBar />

      {/* Right Action */}
      <m.div className="relative z-[1] flex items-center gap-1">
        <VolumeControl />
        <DownloadVideo />
        <FullScreenControl />
      </m.div>
    </m.div>
  )
})

const FullScreenControl = () => {
  const { t } = useTranslation()
  const ref = useContextSelector(VideoPlayerContext, (v) => v.wrapperRef)
  const [isFullScreen, setIsFullScreen] = useState(!!document.fullscreenElement)

  useEffect(() => {
    const onFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", onFullScreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", onFullScreenChange)
    }
  }, [])

  return (
    <ActionIcon
      label={isFullScreen ? t("player.exit_full_screen") : t("player.full_screen")}
      shortcut="f"
      onClick={() => {
        if (!ref.current) return

        if (isFullScreen) {
          document.exitFullscreen()
        } else {
          ref.current.requestFullscreen()
        }
      }}
    >
      {isFullScreen ? (
        <i className="i-mgc-fullscreen-exit-cute-re" />
      ) : (
        <i className="i-mgc-fullscreen-cute-re" />
      )}
    </ActionIcon>
  )
}

const DownloadVideo = () => {
  const { t } = useTranslation()
  const src = useContextSelector(VideoPlayerContext, (v) => v.src)
  const [isDownloading, setIsDownloading] = useState(false)
  const download = useEventCallback(() => {
    setIsDownloading(true)
    fetch(src)
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = src.split("/").pop()!
        a.click()
        URL.revokeObjectURL(url)
        setIsDownloading(false)
      })
  })

  return (
    <ActionIcon shortcut="d" label={t("player.download")} onClick={download}>
      {isDownloading ? (
        <i className="i-mgc-loading-3-cute-re animate-spin" />
      ) : (
        <i className="i-mgc-download-2-cute-re" />
      )}
    </ActionIcon>
  )
}
const VolumeControl = () => {
  const { t } = useTranslation()
  const hasAudio = useContextSelector(VideoPlayerContext, (v) => v.state.hasAudio)

  const controls = useContextSelector(VideoPlayerContext, (v) => v.controls)
  const volume = useContextSelector(VideoPlayerContext, (v) => v.state.volume)
  const muted = useContextSelector(VideoPlayerContext, (v) => v.state.muted)
  if (!hasAudio) return null
  return (
    <ActionIcon
      label={<VolumeSlider onVolumeChange={controls.volume} volume={volume} />}
      enableHoverableContent
      onClick={() => {
        if (muted) {
          controls.unmute()
        } else {
          controls.mute()
        }
      }}
    >
      {muted ? (
        <i className="i-mgc-volume-mute-cute-re" title={t("player.unmute")} />
      ) : (
        <i className="i-mgc-volume-cute-re" title={t("player.mute")} />
      )}
    </ActionIcon>
  )
}

const PlayProgressBar = () => {
  // eslint-disable-next-line @eslint-react/no-use-context
  const { state, controls } = useContext(VideoPlayerContext)
  const [currentDragging, setCurrentDragging] = useState(false)
  const [dragTime, setDragTime] = useState(0)

  useHotkeys("left", (e) => {
    e.preventDefault()
    controls.seek(state.time - 5)
  })

  useHotkeys("right", (e) => {
    e.preventDefault()
    controls.seek(state.time + 5)
  })
  return (
    <Slider.Root
      className="relative z-[1] flex size-full items-center transition-all duration-200 ease-in-out"
      min={0}
      max={state.duration}
      step={0.01}
      value={[currentDragging ? dragTime : state.time]}
      onPointerDown={() => {
        if (state.playing) {
          controls.pause()
        }
        setDragTime(state.time)
        setCurrentDragging(true)
      }}
      onValueChange={(value) => {
        setDragTime(value[0]!)
        startTransition(() => {
          controls.seek(value[0]!)
        })
      }}
      onValueCommit={() => {
        controls.play()
        setCurrentDragging(false)
        controls.seek(dragTime)
      }}
    >
      <Slider.Track className="relative h-1 w-full grow rounded bg-white dark:bg-neutral-800">
        <Slider.Range className="absolute h-1 rounded bg-zinc-500/40 dark:bg-neutral-600" />
      </Slider.Track>

      {/* indicator */}
      <Slider.Thumb
        className="block h-3 w-[3px] rounded-[1px] bg-zinc-500 dark:bg-zinc-400"
        aria-label="Progress"
      />
    </Slider.Root>
  )
}

const ActionIcon = ({
  className,
  onClick,
  children,
  shortcut,
  label,
  enableHoverableContent,
}: {
  className?: string
  onClick?: () => void
  label: React.ReactNode
  children?: React.ReactNode
  shortcut?: string
  enableHoverableContent?: boolean
}) => {
  return (
    <ActionButton
      shortcutOnlyFocusWithIn
      tooltipSide="top"
      className={clsx("z-[2] hover:bg-transparent", className)}
      onClick={onClick}
      tooltip={label}
      shortcut={shortcut}
      enableHoverableContent={enableHoverableContent}
    >
      {children || <i className={className} />}
    </ActionButton>
  )
}
