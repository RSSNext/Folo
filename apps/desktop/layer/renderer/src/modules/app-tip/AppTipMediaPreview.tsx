import { Spring } from "@follow/components/constants/spring.js"
import { AnimatePresence, m } from "motion/react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import type { AppTipStepMedia } from "./types"

type AppTipMediaPreviewProps = {
  media?: AppTipStepMedia
}

export function AppTipMediaPreview({ media }: AppTipMediaPreviewProps) {
  const [hasError, setHasError] = useState(false)
  const [showReplay, setShowReplay] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { t } = useTranslation()
  const mediaKind = media?.kind ?? "video"
  const isVideo = mediaKind === "video"

  useEffect(() => {
    setHasError(false)
    setShowReplay(false)
  }, [media?.src, mediaKind])

  useEffect(() => {
    if (!isVideo) return
    const video = videoRef.current
    if (!video) return

    const handleEnded = () => setShowReplay(true)
    const handlePlay = () => setShowReplay(false)

    video.addEventListener("ended", handleEnded)
    video.addEventListener("play", handlePlay)

    return () => {
      video.removeEventListener("ended", handleEnded)
      video.removeEventListener("play", handlePlay)
    }
  }, [isVideo, media?.src])

  const handleReplay = () => {
    if (isVideo && videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play()
    }
  }

  if (!media?.src || hasError) {
    const fallbackIcon = isVideo ? "i-mgc-video-cute-re" : "i-mgc-photo-album-cute-re"
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-fill px-6 py-10 text-center">
        <i className={`${fallbackIcon} mb-3 text-2xl text-text-tertiary`} />
      </div>
    )
  }

  return (
    <div className="absolute inset-0 aspect-square w-full overflow-hidden bg-material-medium">
      {isVideo ? (
        <>
          <video
            ref={videoRef}
            key={media.src}
            className="size-full object-cover"
            src={media.src}
            poster={media.poster}
            playsInline
            muted
            autoPlay
            preload="metadata"
            onError={() => setHasError(true)}
          />

          <AnimatePresence>
            {showReplay && (
              <m.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={Spring.presets.snappy}
                onClick={handleReplay}
                className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full bg-material-ultra-thick backdrop-blur-background transition-colors hover:bg-material-thick"
                aria-label={t("new_user_dialog.replay_video")}
              >
                <i className="i-mgc-refresh-2-cute-re text-lg text-text" />
              </m.button>
            )}
          </AnimatePresence>
        </>
      ) : (
        <img
          key={media.src}
          className="size-full object-cover"
          src={media.src}
          alt={media.caption ?? ""}
          loading="lazy"
          decoding="async"
          onError={() => setHasError(true)}
        />
      )}
    </div>
  )
}
