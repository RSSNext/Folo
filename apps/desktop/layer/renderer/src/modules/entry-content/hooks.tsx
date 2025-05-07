import { tracker } from "@follow/tracker"
import { EventBus } from "@follow/utils/event-bus"
import { createElement, useCallback, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useModalStack } from "~/components/ui/modal/stacked/hooks"

import { ImageGalleryContent } from "./components/ImageGalleryContent"

declare module "@follow/utils/event-bus" {
  export interface CustomEvent {
    FOCUS_ENTRY_CONTAINER: never
  }
}

export const useFocusEntryContainerSubscriptions = (
  ref: React.RefObject<HTMLDivElement | null>,
) => {
  useEffect(() => {
    return EventBus.subscribe("FOCUS_ENTRY_CONTAINER", () => {
      ref.current?.focus()
    })
  }, [ref])
}

export const useGalleryModal = () => {
  const { present } = useModalStack()
  const { t } = useTranslation()
  return useCallback(
    (entryId?: string) => {
      if (!entryId) {
        // this should not happen unless there is a bug in the code
        toast.error("Invalid feed id")
        return
      }
      tracker.entryContentHeaderImageGalleryClick({
        feedId: entryId,
      })
      present({
        title: t("entry_actions.image_gallery"),
        content: () => createElement(ImageGalleryContent, { entryId }),
        max: true,
        clickOutsideToDismiss: true,
      })
    },
    [present, t],
  )
}
