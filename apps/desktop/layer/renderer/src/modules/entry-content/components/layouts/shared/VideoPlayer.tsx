import { isMobile } from "@follow/components/hooks/useMobile.js"
import { IN_ELECTRON } from "@follow/shared/constants"
import { useEntry } from "@follow/store/entry/hooks"
import { stopPropagation } from "@follow/utils/dom"
import { formatDuration } from "@follow/utils/duration"
import { transformVideoUrl } from "@follow/utils/url-for-video"
import { cn } from "@follow/utils/utils"
import { useHover } from "@use-gesture/react"
import { useEffect, useMemo, useRef, useState } from "react"

import { AudioPlayer } from "~/atoms/player"
import { m } from "~/components/common/Motion"
import { HTML } from "~/components/ui/markdown/HTML"
import { Media } from "~/components/ui/media/Media"
import type { ModalContentComponent } from "~/components/ui/modal"
import { FixedModalCloseButton } from "~/components/ui/modal/components/close"
import { PlainModal } from "~/components/ui/modal/stacked/custom-modal"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { useRenderStyle } from "~/hooks/biz/useRenderStyle"

const ViewTag = IN_ELECTRON ? "webview" : "iframe"

interface VideoPlayerProps {
  entryId: string
  className?: string
  showDuration?: boolean
  preferFullSize?: boolean
  translation?: {
    content?: string
    title?: string
  }
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  entryId,
  className,
  showDuration = true,
  preferFullSize = false,
  translation,
}) => {
  const entry = useEntry(entryId, (state) => {
    const { url, media } = state

    const attachments = state.attachments || []
    const { duration_in_seconds } =
      attachments?.find((attachment) => attachment.duration_in_seconds) ?? {}
    const seconds = duration_in_seconds
      ? Number.parseInt(duration_in_seconds.toString())
      : undefined
    const duration = formatDuration(seconds)

    const firstMedia = media?.[0]

    return { attachments, duration, firstMedia, url, media }
  })

  const [miniIframeSrc, iframeSrc] = useMemo(
    () => [
      transformVideoUrl({
        url: entry?.url ?? "",
        mini: true,
        isIframe: !IN_ELECTRON,
        attachments: entry?.attachments,
      }),
      transformVideoUrl({
        url: entry?.url ?? "",
        isIframe: !IN_ELECTRON,
        attachments: entry?.attachments,
      }),
    ],
    [entry?.attachments, entry?.url],
  )

  const modalStack = useModalStack()

  const ref = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  useHover(
    (event) => {
      setHovered(event.active)
    },
    {
      target: ref,
    },
  )

  const [showPreview, setShowPreview] = useState(false)
  useEffect(() => {
    if (hovered) {
      const timer = setTimeout(() => {
        setShowPreview(true)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setShowPreview(false)
      return () => {}
    }
  }, [hovered])

  if (!entry) return null

  return (
    <div
      className={cn("w-full cursor-pointer", className)}
      onClick={(e) => {
        if (isMobile() && entry.url) {
          window.open(entry.url, "_blank")
          e.stopPropagation()
          return
        }
        if (iframeSrc) {
          modalStack.present({
            title: "",
            content: (props) => (
              <PreviewVideoModalContent
                src={iframeSrc}
                entryId={entryId}
                translation={translation}
                {...props}
              />
            ),
            clickOutsideToDismiss: true,
            CustomModalComponent: PlainModal,
            overlay: true,
          })
        }
      }}
    >
      <div className="relative aspect-video w-full" ref={ref}>
        {preferFullSize && iframeSrc ? (
          <ViewTag
            src={iframeSrc}
            className="aspect-video w-full rounded-md bg-black object-cover"
          />
        ) : miniIframeSrc && showPreview ? (
          <ViewTag
            src={miniIframeSrc}
            className="pointer-events-none aspect-video w-full rounded-md bg-black object-cover"
          />
        ) : entry.firstMedia ? (
          <Media
            key={entry.firstMedia.url}
            src={entry.firstMedia.url}
            type={entry.firstMedia.type}
            previewImageUrl={entry.firstMedia.preview_image_url}
            className="aspect-video w-full rounded-md object-cover"
            loading="lazy"
            proxy={{
              width: 640,
              height: 360,
            }}
            showFallback={true}
          />
        ) : (
          <div className="center bg-material-medium text-text-secondary aspect-video w-full flex-col gap-1 rounded-md text-xs">
            <i className="i-mgc-sad-cute-re size-6" />
            No video available
          </div>
        )}
        {!!entry.duration && showDuration && (
          <div className="absolute bottom-2 right-2 rounded-md bg-black/50 px-1 py-0.5 text-xs font-medium text-white">
            {entry.duration}
          </div>
        )}
      </div>
    </div>
  )
}

const PreviewVideoModalContent: ModalContentComponent<{
  src: string
  entryId: string
  translation?: {
    content?: string
    title?: string
  }
}> = ({ dismiss, src, entryId, translation }) => {
  const entry = useEntry(entryId, (state) => ({ content: state.content }))

  const content = translation?.content || entry?.content
  const currentAudioPlayerIsPlay = useRef(AudioPlayer.get().status === "playing")

  const renderStyle = useRenderStyle()

  useEffect(() => {
    const currentValue = currentAudioPlayerIsPlay.current
    if (currentValue) {
      AudioPlayer.pause()
    }
    return () => {
      if (currentValue) {
        AudioPlayer.play()
      }
    }
  }, [])

  return (
    <m.div exit={{ scale: 0.94, opacity: 0 }} className="size-full p-12" onClick={() => dismiss()}>
      <m.div
        onFocusCapture={stopPropagation}
        initial={true}
        exit={{
          opacity: 0,
        }}
        className="safe-inset-top-4 fixed right-4 flex items-center"
      >
        <FixedModalCloseButton onClick={dismiss} />
      </m.div>

      <ViewTag src={src} className="size-full" />
      {!!content && (
        <div className="bg-background p-10 pt-5 backdrop-blur-sm">
          <HTML
            as="div"
            className="prose dark:prose-invert !max-w-full"
            noMedia
            style={renderStyle}
          >
            {content}
          </HTML>
        </div>
      )}
    </m.div>
  )
}
