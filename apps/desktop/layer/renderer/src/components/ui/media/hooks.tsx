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
    (media?: PreviewMediaProps[], initialIndex = 0) => {
      if (!media || media.length === 0) {
        return
      }
      if (isMobile()) {
        window.open(replaceImgUrlIfNeed(media[initialIndex]!.url))
        return
      }
      present({
        content: () => (
          <PreviewMediaContent initialIndex={initialIndex} media={media}>
            {children}
          </PreviewMediaContent>
        ),
        autoFocus: false,
        title: "Media Preview",
        overlay: false,
        overlayOptions: {
          blur: false,
          className: "bg-transparent",
        },
        CustomModalComponent: PlainModal,
        clickOutsideToDismiss: false,
      })
    },
    [children, present],
  )
}
