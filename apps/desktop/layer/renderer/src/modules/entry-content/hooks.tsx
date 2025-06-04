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
import { useAuthQuery } from "~/hooks/common/useBizQuery"
import { Queries } from "~/queries"
import { useEntryTranslation } from "~/store/ai/hook"
import { useEntry } from "~/store/entry/hooks"
import { useInboxById } from "~/store/inbox/hooks"

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
    const { inboxId } = state
    const { content } = state.entries
    return { inboxId, content }
  })
  const isInbox = useInboxById(entry?.inboxId, (inbox) => inbox !== null)
  const { error, data, isPending } = useAuthQuery(
    isInbox ? Queries.entries.byInboxId(entryId) : Queries.entries.byId(entryId),
    {
      staleTime: 300_000,
    },
  )

  const isInReadabilityMode = useEntryIsInReadability(entryId)
  const isReadabilitySuccess = useEntryIsInReadabilitySuccess(entryId)
  const readabilityContent = useEntryReadabilityContent(entryId)
  const contentTranslated = useEntryTranslation({
    entryId,
    extraFields: isReadabilitySuccess ? ["readabilityContent"] : ["content"],
  })

  return useMemo(() => {
    const entryContent = isInReadabilityMode
      ? readabilityContent?.content
      : (entry?.content ?? data?.entries.content)
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
    data?.entries.content,
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
      entry?.entries.media
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
