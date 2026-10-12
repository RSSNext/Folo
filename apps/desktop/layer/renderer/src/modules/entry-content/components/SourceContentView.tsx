import { Spring } from "@follow/components/constants/spring.js"
import { Button } from "@follow/components/ui/button/index.js"
import { IN_ELECTRON } from "@follow/shared/constants"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

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
        className="min-h-0 w-full grow"
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
      {!IN_ELECTRON && <EmbedBlockedNotice src={src} />}
    </div>
  )
}

// A site that refuses to be framed (X-Frame-Options or CSP frame-ancestors)
// still fires the iframe load event, so the web build cannot tell it from a
// loaded page and always offers to open the page in a new tab instead.
const EmbedBlockedNotice = ({ src }: { src: string }) => {
  const { t } = useTranslation()

  return (
    <div className="relative flex shrink-0 items-center gap-3 border-t border-border px-4 py-2 text-sm text-text-secondary">
      <i className="i-mgc-information-cute-re shrink-0 text-base" />
      <span className="min-w-0 grow">{t("entry_content.source_embed_notice")}</span>
      <Button variant="outline" size="sm" onClick={() => window.open(src, "_blank")}>
        {t("entry_actions.open_in_browser", { which: t("words.newTab") })}
      </Button>
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
