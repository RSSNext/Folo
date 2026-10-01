import { isMobile } from "@follow/components/hooks/useMobile.js"
import { use, useCallback } from "react"
import { useTranslation } from "react-i18next"

import { PlainModal } from "../modal/stacked/custom-modal"
import { useModalStack } from "../modal/stacked/hooks"
import { MediaContainerWidthContext } from "./MediaContainerWidthContext"
import type { PreviewMediaProps } from "./PreviewMediaContent"
import { PreviewMediaContent } from "./PreviewMediaContent"

export const usePreviewMedia = (children?: React.ReactNode) => {
  const { present } = useModalStack()
  const { t } = useTranslation()
  return useCallback(
    (media?: PreviewMediaProps[], initialIndex = 0) => {
      if (!media || media.length === 0) {
        return
      }
      if (isMobile()) {
        window.open(media[initialIndex]!.url)
        return
      }
      present({
        content: () => (
          <PreviewMediaContent initialIndex={initialIndex} media={media}>
            {children}
          </PreviewMediaContent>
        ),
        autoFocus: false,
        title: t("media.preview_title"),
        overlay: false,
        overlayOptions: {
          blur: false,
          className: "bg-transparent",
        },
        CustomModalComponent: PlainModal,
        clickOutsideToDismiss: false,
      })
    },
    [children, present, t],
  )
}

export const useMediaContainerWidth = () => {
  return use(MediaContainerWidthContext)
}
