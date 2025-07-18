import { MagneticHoverEffect } from "@follow/components/ui/effect/MagneticHoverEffect.js"
import type { LinkProps } from "@follow/components/ui/link/LinkWithTooltip.js"
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@follow/components/ui/tooltip/index.jsx"
import { useCorrectZIndex } from "@follow/components/ui/z-index/ctx.js"
import { stopPropagation } from "@follow/utils"
import { use, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { copyToClipboard } from "~/lib/clipboard"

import { MarkdownRenderActionContext } from "../context"

export const MarkdownLink = (props: LinkProps) => {
  const { transformUrl, isAudio, ensureAndRenderTimeStamp } = use(MarkdownRenderActionContext)
  const { t } = useTranslation()

  const populatedFullHref = transformUrl(props.href)

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
        <MagneticHoverEffect
          as="a"
          draggable="false"
          className="text-text font-semibold no-underline"
          href={populatedFullHref}
          title={props.title}
          target="_blank"
          rel="noreferrer"
          onClick={stopPropagation}
        >
          {props.children}

          {typeof props.children === "string" && (
            <i className="i-mgc-arrow-right-up-cute-re size-[0.9em] translate-y-[2px] opacity-70" />
          )}
        </MagneticHoverEffect>
      </TooltipTrigger>
      {!!populatedFullHref && (
        <TooltipPortal>
          <TooltipContent align="start" className="break-all" style={{ zIndex }} side="bottom">
            <span>{populatedFullHref}</span>
            <button
              type="button"
              className="text-accent ml-2 cursor-pointer"
              onClick={handleCopyLink}
            >
              {t("share.copy_link")}
            </button>
          </TooltipContent>
        </TooltipPortal>
      )}
    </Tooltip>
  )
}
