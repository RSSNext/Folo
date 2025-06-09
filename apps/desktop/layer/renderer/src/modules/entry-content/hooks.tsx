import { useEntry, usePrefetchEntryDetail } from "@follow/store/entry/hooks"
import { tracker } from "@follow/tracker"
import { createElement, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import {
  useEntryIsInReadability,
  useEntryIsInReadabilitySuccess,
  useEntryReadabilityContent,
} from "~/atoms/readability"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { useEntryTranslation } from "~/store/ai/hook"

import { ImageGalleryContent } from "./components/ImageGalleryContent"

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

export const useEntryContent = (entryId: string) => {
  const entry = useEntry(entryId, (state) => {
    const { inboxHandle, content } = state
    return { inboxId: inboxHandle, content }
  })
  const { error, data, isPending } = usePrefetchEntryDetail(entryId)

  const isInReadabilityMode = useEntryIsInReadability(entryId)
  const isReadabilitySuccess = useEntryIsInReadabilitySuccess(entryId)
  const readabilityContent = useEntryReadabilityContent(entryId)
  const contentTranslated = useEntryTranslation({
    entryId,
    extraFields: isReadabilitySuccess ? ["readabilityContent"] : ["content"],
    view: undefined,
  })

  return useMemo(() => {
    const entryContent = isInReadabilityMode
      ? readabilityContent?.content
      : (entry?.content ?? data?.content)
    const translatedContent = isInReadabilityMode
      ? contentTranslated.data?.readabilityContent
      : contentTranslated.data?.content
    const content = translatedContent || entryContent
    return {
      content,
      error,
      isPending,
    }
  }, [
    contentTranslated.data?.content,
    contentTranslated.data?.readabilityContent,
    data?.content,
    entry?.content,
    error,
    isInReadabilityMode,
    isPending,
    readabilityContent?.content,
  ])
}

export const useEntryMediaInfo = (entryId: string) => {
  return useEntry(entryId, (entry) =>
    Object.fromEntries(
      entry?.media
        ?.filter((m) => m.type === "photo")
        .map((cur) => [
          cur.url,
          {
            width: cur.width,
            height: cur.height,
          },
        ]) ?? [],
    ),
  )
}
