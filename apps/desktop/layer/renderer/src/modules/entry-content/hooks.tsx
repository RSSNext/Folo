import { useEntry, usePrefetchEntryDetail } from "@follow/store/entry/hooks"
import { useEntryTranslation, usePrefetchEntryTranslation } from "@follow/store/translation/hooks"
import { tracker } from "@follow/tracker"
import { createElement, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useEntryIsInReadability, useEntryIsInReadabilitySuccess } from "~/atoms/readability"
import { useActionLanguage, useGeneralSettingKey } from "~/atoms/settings/general"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { checkLanguage } from "~/lib/translate"

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
    const { inboxHandle, content, readabilityContent } = state
    return { inboxId: inboxHandle, content, readabilityContent }
  })
  const { error, data, isPending } = usePrefetchEntryDetail(entryId)

  const isInReadabilityMode = useEntryIsInReadability(entryId)
  const isReadabilitySuccess = useEntryIsInReadabilitySuccess(entryId)

  const actionLanguage = useActionLanguage()
  const enableTranslation = useGeneralSettingKey("translation")
  const contentTranslated = useEntryTranslation(entryId, actionLanguage)
  usePrefetchEntryTranslation({
    entryIds: [entryId],
    checkLanguage,
    translation: enableTranslation,
    language: actionLanguage,
    withContent: true,
    target: isReadabilitySuccess ? "readabilityContent" : "content",
  })

  return useMemo(() => {
    const entryContent = isInReadabilityMode
      ? entry?.readabilityContent
      : (entry?.content ?? data?.content)
    const translatedContent = isInReadabilityMode
      ? contentTranslated?.readabilityContent
      : contentTranslated?.content
    const content = translatedContent || entryContent
    return {
      content,
      error,
      isPending,
    }
  }, [
    contentTranslated?.content,
    contentTranslated?.readabilityContent,
    data?.content,
    entry?.content,
    error,
    isInReadabilityMode,
    isPending,
    entry?.readabilityContent,
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
