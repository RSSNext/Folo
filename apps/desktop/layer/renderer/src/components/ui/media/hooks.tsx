import { isMobile } from "@follow/components/hooks/useMobile.js"
import { useCallback } from "react"

import { replaceImgUrlIfNeed } from "~/lib/img-proxy"

import { PlainModal } from "../modal/stacked/custom-modal"
import { useModalStack } from "../modal/stacked/hooks"
import type { PreviewMediaProps } from "./preview-media"
import { PreviewMediaContent } from "./preview-media"

export const usePreviewMedia = (children?: React.ReactNode) => {
  const { present } = useModalStack()
  return useCallback(
    (media: PreviewMediaProps[], initialIndex = 0) => {
      if (isMobile()) {
        window.open(replaceImgUrlIfNeed(media[initialIndex]!.url))
        return
      }
      present({
        content: () => (
          <div className="relative size-full">
            <PreviewMediaContent initialIndex={initialIndex} media={media}>
              {children}
            </PreviewMediaContent>
          </div>
        ),
        title: "Media Preview",
        overlay: true,
        overlayOptions: {
          blur: true,
          className: "bg-black/80",
        },
        CustomModalComponent: PlainModal,
        clickOutsideToDismiss: true,
      })
    },
    [children, present],
  )
}
