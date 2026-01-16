import { Button } from "@follow/components/ui/button/index.js"
import type { LinkProps } from "@follow/components/ui/link/LinkWithTooltip.js"
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@follow/components/ui/tooltip/index.jsx"
import { useCorrectZIndex } from "@follow/components/ui/z-index/ctx.js"
import { env } from "@follow/shared/env.desktop"
import { feedSyncServices } from "@follow/store/feed/store"
import { cn, parseSafeUrl, stopPropagation } from "@follow/utils"
import type { MouseEvent } from "react"
import { use, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { navigateEntry } from "~/hooks/biz/useNavigateEntry"
import { copyToClipboard } from "~/lib/clipboard"

import { MarkdownRenderActionContext } from "../context"

export const MarkdownLink: Component<LinkProps> = (props) => {
  const { transformUrl, isAudio, ensureAndRenderTimeStamp } = use(MarkdownRenderActionContext)
  const { t } = useTranslation()

  const populatedFullHref = transformUrl(props.href)
  const shareFeedInfo = parseShareFeedInfo(populatedFullHref)

  const handleCopyLink = useCallback(async () => {
    try {
      if (!populatedFullHref) {
        throw new Error("No URL to copy")
      }
      await copyToClipboard(populatedFullHref)
      toast.success(t("share.link_copied"))
    } catch {
      toast.error(t("share.copy_failed"))
    }
  }, [populatedFullHref, t])

  const handleShareFeedClick = useCallback(
    async (event: MouseEvent<HTMLAnchorElement>) => {
      stopPropagation(event)
      if (!shareFeedInfo) {
        return
      }
      event.preventDefault()

      const view = await resolveShareFeedView(shareFeedInfo)
      navigateEntry({
        feedId: shareFeedInfo.id,
        entryId: null,
        view,
      })
    },
    [shareFeedInfo],
  )

  const parseTimeStamp = isAudio(populatedFullHref)
  const zIndex = useCorrectZIndex(0)
  if (parseTimeStamp) {
    const childrenText = props.children

    if (typeof childrenText === "string") {
      const renderer = ensureAndRenderTimeStamp(childrenText)
      if (renderer) return renderer
    }
  }

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <a
          draggable="false"
          className={cn(
            "follow-link--underline font-semibold text-text no-underline",
            props.className,
          )}
          href={populatedFullHref}
          title={props.title}
          target="_blank"
          rel="noreferrer"
          onClick={shareFeedInfo ? handleShareFeedClick : stopPropagation}
        >
          {props.children}

          {typeof props.children === "string" && (
            <i className="i-mgc-arrow-right-up-cute-re size-[0.9em] translate-y-[2px] opacity-70" />
          )}
        </a>
      </TooltipTrigger>
      {!!populatedFullHref && (
        <TooltipPortal>
          <TooltipContent align="start" className="break-all" style={{ zIndex }} side="bottom">
            <a
              className="follow-link--underline"
              href={populatedFullHref}
              target="_blank"
              rel="noreferrer"
            >
              {populatedFullHref}
            </a>

            <Button
              onClick={handleCopyLink}
              buttonClassName="ml-1 p-1 cursor-link"
              variant={"ghost"}
              aria-label={t("share.copy_link")}
            >
              <i className="i-mgc-copy-2-cute-re size-3" />
            </Button>
          </TooltipContent>
        </TooltipPortal>
      )}
    </Tooltip>
  )
}

const parseShareFeedInfo = (href?: string) => {
  if (!href) return null

  const baseUrl = parseSafeUrl(env.VITE_WEB_URL)
  if (!baseUrl) return null

  let parsedUrl: URL
  try {
    parsedUrl = new URL(href, baseUrl)
  } catch {
    return null
  }

  if (parsedUrl.host !== baseUrl.host) return null

  const pathParts = parsedUrl.pathname.split("/").filter(Boolean)
  if (pathParts.length !== 3 || pathParts[0] !== "share" || pathParts[1] !== "feeds") {
    return null
  }

  const viewParam = parsedUrl.searchParams.get("view")
  const view = viewParam ? Number.parseInt(viewParam, 10) : undefined

  return {
    id: pathParts[2]!,
    view: Number.isNaN(view) ? undefined : view,
  }
}

const resolveShareFeedView = async (info: { id: string; view?: number }) => {
  if (typeof info.view === "number") {
    return info.view
  }

  const data = await feedSyncServices.fetchFeedById({ id: info.id }).catch(() => {})
  const analyticsView = data?.analytics?.view
  if (typeof analyticsView === "number") {
    return analyticsView
  }

  return 0
}
