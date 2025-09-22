import { isMobile } from "@follow/components/hooks/useMobile.js"
import { use, useCallback } from "react"

import { replaceImgUrlIfNeed } from "~/lib/img-proxy"
import { AIChatRoot } from "~/modules/ai-chat/components/layouts/AIChatRoot"

import { PlainModal } from "../modal/stacked/custom-modal"
import { useModalStack } from "../modal/stacked/hooks"
import { MediaContainerWidthContext } from "./MediaContainerWidthContext"
import type { PreviewMediaProps } from "./PreviewMediaContent"
import { PreviewMediaContent } from "./PreviewMediaContent"

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
          <AIChatRoot>
            <PreviewMediaContent initialIndex={initialIndex} media={media}>
              {children}
            </PreviewMediaContent>
          </AIChatRoot>
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

export const useMediaContainerWidth = () => {
  return use(MediaContainerWidthContext)
}
