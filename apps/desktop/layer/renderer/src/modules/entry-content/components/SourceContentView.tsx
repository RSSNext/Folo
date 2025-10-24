import { Spring } from "@follow/components/constants/spring.js"
import { IN_ELECTRON } from "@follow/shared/constants"
import { useEffect, useRef, useState } from "react"

import { useShowSourceContent } from "~/atoms/source-content"
import { m } from "~/components/common/Motion"

import { EntryContentLoading } from "./entry-content/EntryContentLoading"

const ViewTag = IN_ELECTRON ? "webview" : "iframe"

export const SourceContentView = ({ src }: { src: string }) => {
  const showSourceContent = useShowSourceContent()
  const [loading, setLoading] = useState(true)
  const webviewRef = useRef<HTMLIFrameElement | null>(null)

  useEffect(() => {
    const abortController = new AbortController()
    const webview = webviewRef.current
    if (!webview) return
    const handleDidStopLoading = () => setLoading(false)

    // See https://www.electronjs.org/docs/latest/api/webview-tag#example
    webview.addEventListener("did-stop-loading", handleDidStopLoading, {
      signal: abortController.signal,
    })

    return () => {
      abortController.abort()
    }
  }, [src, showSourceContent])

  return (
    <div className="relative flex size-full flex-col">
      {loading && (
        <div className="center absolute inset-0 mt-16 min-w-0">
          <EntryContentLoading icon={src} />
        </div>
      )}
      <m.div
        className="size-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={Spring.presets.smooth}
      >
        <ViewTag
          ref={webviewRef}
          className="size-full"
          src={src}
          sandbox="allow-scripts allow-same-origin"
          // For iframe
          onLoad={() => setLoading(false)}
        />
      </m.div>
    </div>
  )
}

export const SourceContentPanel = ({ src }: { src: string | null }) => {
  const showSourceContent = useShowSourceContent()
  if (!showSourceContent || !src) return null
  return (
    <div data-hide-in-print className="absolute left-0 top-0 z-[1] size-full bg-theme-background">
      <SourceContentView src={src} />
    </div>
  )
}
