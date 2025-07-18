import { getMousePosition } from "@follow/components/hooks/useMouse.js"
import { FeedViewType, UserRole } from "@follow/constants"
import { IN_ELECTRON } from "@follow/shared/constants"
import { isEntryStarred } from "@follow/store/collection/getter"
import { collectionSyncService } from "@follow/store/collection/store"
import { getEntry } from "@follow/store/entry/getter"
import { entrySyncServices } from "@follow/store/entry/store"
import { unreadSyncService } from "@follow/store/unread/store"
import { useUserRole } from "@follow/store/user/hooks"
import { cn, resolveUrlWithBase } from "@follow/utils/utils"
import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { toggleShowAISummaryOnce } from "~/atoms/ai-summary"
import { toggleShowAITranslationOnce } from "~/atoms/ai-translation"
import { AudioPlayer, getAudioPlayerAtomValue } from "~/atoms/player"
import { showPopover } from "~/atoms/popover"
import { useIsInMASReview } from "~/atoms/server-configs"
import { useGeneralSettingKey } from "~/atoms/settings/general"
import {
  getShowSourceContent,
  toggleShowSourceContent,
  useSourceContentModal,
} from "~/atoms/source-content"
import { SharePanel } from "~/components/common/SharePanel"
import { toggleEntryReadability } from "~/hooks/biz/useEntryActions"
import { navigateEntry } from "~/hooks/biz/useNavigateEntry"
import { getRouteParams } from "~/hooks/biz/useRouteParams"
import { ipcServices } from "~/lib/client"
import { copyToClipboard } from "~/lib/clipboard"
import { parseHtml } from "~/lib/parse-html"
import { useActivationModal } from "~/modules/activation"
import { markAllByRoute } from "~/modules/entry-column/hooks/useMarkAll"
import { useGalleryModal } from "~/modules/entry-content/hooks"
import { useTipModal } from "~/modules/wallet/hooks"

import { useRegisterFollowCommand } from "../hooks/use-register-command"
import type { Command, CommandCategory } from "../types"
import { COMMAND_ID } from "./id"

const category: CommandCategory = "category.entry"

const useCollect = () => {
  const { t } = useTranslation()
  return useMutation({
    mutationFn: async ({ entryId, view }: { entryId: string; view: FeedViewType }) =>
      collectionSyncService.starEntry({
        entryId,
        view,
      }),

    onSuccess: () => {
      toast.success(t("entry_actions.starred"), {
        duration: 1000,
      })
    },
  })
}

const useUnCollect = () => {
  const { t } = useTranslation()
  return useMutation({
    mutationFn: async (entryId: string) => collectionSyncService.unstarEntry(entryId),

    onSuccess: () => {
      toast.success(t("entry_actions.unstarred"), {
        duration: 1000,
      })
    },
  })
}

const useDeleteInboxEntry = () => {
  const { t } = useTranslation()
  return useMutation({
    mutationFn: async (entryId: string) => {
      await entrySyncServices.deleteInboxEntry(entryId)
    },
    onSuccess: () => {
      toast.success(t("entry_actions.deleted"))
    },
    onError: () => {
      toast.error(t("entry_actions.failed_to_delete"))
    },
  })
}

export const useRead = () =>
  useMutation({
    mutationFn: async ({ entryId }: { entryId: string }) =>
      unreadSyncService.markEntryAsRead(entryId),
  })

export const useUnread = () =>
  useMutation({
    mutationFn: async ({ entryId }: { entryId: string }) =>
      unreadSyncService.markEntryAsUnread(entryId),
  })

export const useRegisterEntryCommands = () => {
  const { t } = useTranslation()
  const collect = useCollect()
  const uncollect = useUnCollect()
  const deleteInboxEntry = useDeleteInboxEntry()
  const showSourceContentModal = useSourceContentModal()
  const openTipModal = useTipModal()
  const openGalleryModal = useGalleryModal()
  const read = useRead()
  const unread = useUnread()

  const role = useUserRole()
  const presentActivationModal = useActivationModal()

  const voice = useGeneralSettingKey("voice")

  const isInMASReview = useIsInMASReview()

  useRegisterFollowCommand(
    [
      ...(isInMASReview
        ? ([] as any[])
        : [
            {
              id: COMMAND_ID.entry.tip,
              label: t("entry_actions.tip"),
              icon: <i className="i-mgc-power-outline" />,
              category,
              run: ({ userId, feedId, entryId }) => {
                openTipModal({
                  userId,
                  feedId,
                  entryId,
                })
              },
            },
          ]),
      {
        id: COMMAND_ID.entry.star,
        label: t("entry_actions.star"),
        category,
        icon: (props) => (
          <i
            className={cn(
              props?.isActive ? "i-mgc-star-cute-fi text-orange-500" : "i-mgc-star-cute-re",
            )}
          />
        ),
        run: ({ entryId, view }) => {
          const entry = getEntry(entryId)
          const isStarred = isEntryStarred(entryId)
          if (!entry) {
            toast.error("Failed to star: entry is not available", { duration: 3000 })
            return
          }

          if (isStarred) {
            uncollect.mutate(entry.id)
          } else {
            collect.mutate({ entryId, view })
          }
        },
      },
      {
        id: COMMAND_ID.entry.delete,
        label: t("entry_actions.delete"),
        icon: <i className="i-mgc-delete-2-cute-re" />,
        category,
        run: ({ entryId }) => {
          const entry = getEntry(entryId)
          if (!entry) {
            toast.error("Failed to delete: entry is not available", { duration: 3000 })
            return
          }
          deleteInboxEntry.mutate(entry.id)
        },
      },
      {
        id: COMMAND_ID.entry.copyLink,
        label: t("entry_actions.copy_link"),
        icon: <i className="i-mgc-link-cute-re" />,
        category,
        run: ({ entryId }) => {
          const entry = getEntry(entryId)
          if (!entry) {
            toast.error("Failed to copy link: entry is not available", { duration: 3000 })
            return
          }
          if (!entry.url) return
          copyToClipboard(entry.url)
          toast(t("entry_actions.copied_notify", { which: t("words.link") }), {
            duration: 1000,
          })
        },
      },
      {
        id: COMMAND_ID.entry.exportAsPDF,
        label: t("entry_actions.export_as_pdf"),
        icon: <i className="i-mgc-pdf-cute-re" />,
        category,
        run: ({ entryId }) => {
          const entry = getEntry(entryId)

          if (!entry) {
            toast.error("Failed to export as pdf: entry is not available", { duration: 3000 })
            return
          }

          window.print()
        },
      },
      {
        id: COMMAND_ID.entry.copyTitle,
        label: t("entry_actions.copy_title"),
        icon: <i className="i-mgc-copy-cute-re" />,
        category,
        run: ({ entryId }) => {
          const entry = getEntry(entryId)
          if (!entry) {
            toast.error("Failed to copy link: entry is not available", { duration: 3000 })
            return
          }
          if (!entry.title) return
          copyToClipboard(entry.title)
          toast(t("entry_actions.copied_notify", { which: t("words.title") }), {
            duration: 1000,
          })
        },
      },
      {
        id: COMMAND_ID.entry.openInBrowser,
        label: t("entry_actions.open_in_browser", {
          which: t(IN_ELECTRON ? "words.browser" : "words.newTab"),
        }),
        category,
        icon: <i className="i-mgc-world-2-cute-re" />,
        run: ({ entryId }) => {
          const entry = getEntry(entryId)
          if (!entry || !entry.url) {
            toast.error("Failed to open in browser: url is not available", { duration: 3000 })
            return
          }
          window.open(entry.url, "_blank")
        },
      },
      {
        id: COMMAND_ID.entry.viewSourceContent,
        label: {
          title: t("entry_actions.view_source_content"),
          description: t("entry_actions.view_source_content_description"),
        },
        icon: <i className="i-mgc-web-cute-re" />,
        category,
        run: ({ entryId, siteUrl }) => {
          if (!getShowSourceContent()) {
            const entry = getEntry(entryId)
            if (!entry || !entry.url) {
              toast.error("Failed to view source content: url is not available", { duration: 3000 })
              return
            }
            const routeParams = getRouteParams()
            const viewPreviewInModal = [
              FeedViewType.SocialMedia,
              FeedViewType.Videos,
              FeedViewType.Pictures,
            ].includes(routeParams.view)
            if (viewPreviewInModal) {
              showSourceContentModal({
                title: entry.title ?? undefined,
                src: siteUrl ? resolveUrlWithBase(entry.url, siteUrl) : entry.url,
              })
              return
            }
            const layoutEntryId = routeParams.entryId
            if (layoutEntryId !== entry.id) {
              navigateEntry({ entryId: entry.id })
            }
          }
          toggleShowSourceContent()
        },
      },
      {
        id: COMMAND_ID.entry.share,
        label: t("entry_actions.share"),
        icon: <i className="i-mgc-share-forward-cute-re" />,
        category,
        run: ({ entryId }) => {
          const entry = getEntry(entryId)
          if (!entry || !entry.url) {
            toast.error("Failed to share: url is not available", { duration: 3000 })
            return
          }

          const xy = getMousePosition()
          showPopover(
            {
              x: xy.x,
              y: xy.y + 20,
            },
            <SharePanel entryId={entry.id} />,
          )
        },
      },
      {
        id: COMMAND_ID.entry.readAbove,
        label: t("entry_actions.mark_above_as_read"),
        category,
        run: ({ publishedAt }: { publishedAt: string }) => {
          return markAllByRoute(getRouteParams(), {
            startTime: new Date(publishedAt).getTime() + 1,
            endTime: Date.now(),
          })
        },
      },
      {
        id: COMMAND_ID.entry.read,
        label: t("entry_actions.mark_as_read"),
        category,
        icon: (props) => (
          <i className={cn(props?.isActive ? "i-mgc-round-cute-re" : "i-mgc-round-cute-fi")} />
        ),
        run: ({ entryId }) => {
          const entry = getEntry(entryId)
          if (!entry) {
            toast.error("Failed to mark as unread: feed is not available", { duration: 3000 })
            return
          }
          if (entry.read) {
            unread.mutate({ entryId })
          } else {
            read.mutate({ entryId })
          }
        },
      },
      {
        id: COMMAND_ID.entry.readBelow,
        label: t("entry_actions.mark_below_as_read"),
        category,
        run: ({ publishedAt }: { publishedAt: string }) => {
          return markAllByRoute(getRouteParams(), {
            startTime: 1,
            endTime: new Date(publishedAt).getTime() - 1,
          })
        },
      },
      {
        id: COMMAND_ID.entry.imageGallery,
        label: {
          title: t("entry_actions.image_gallery"),
          description: t("entry_actions.image_gallery_description"),
        },
        icon: <i className="i-mgc-pic-cute-fi" />,
        category,
        run: ({ entryId }) => {
          openGalleryModal(entryId)
        },
      },
      {
        id: COMMAND_ID.entry.tts,
        label: {
          title: t("entry_content.header.play_tts"),
          description: t("entry_content.header.play_tts_description"),
        },
        category,
        icon: <i className="i-mgc-voice-cute-re" />,
        run: async ({ entryId }) => {
          if (getAudioPlayerAtomValue().entryId === entryId) {
            AudioPlayer.togglePlayAndPause()
          } else {
            const entryContent = getEntry(entryId)?.content
            if (!entryContent) {
              return
            }
            const filePath = await ipcServices?.reader.tts({
              id: entryId,
              text: parseHtml(entryContent).toText(),
              voice,
            })
            if (filePath) {
              AudioPlayer.mount({
                type: "audio",
                entryId,
                src: `file://${filePath}`,
                currentTime: 0,
              })
            }
          }
        },
      },
      {
        id: COMMAND_ID.entry.readability,
        category,
        label: {
          title: t("entry_content.header.readability"),
          description: t("entry_content.header.readability_description"),
        },
        icon: (props) => (
          <i className={props?.isActive ? "i-mgc-docment-cute-fi" : "i-mgc-docment-cute-re"} />
        ),
        run: async ({ entryId, entryUrl }) => {
          return toggleEntryReadability({
            id: entryId,
            url: entryUrl,
          })
        },
      },
    ],
    {
      deps: [isInMASReview],
    },
  )

  useRegisterFollowCommand(
    [
      {
        id: COMMAND_ID.entry.toggleAISummary,
        label: t("entry_actions.toggle_ai_summary"),
        icon: <i className="i-mgc-ai-cute-re" />,
        category,
        run: () => {
          if (role === UserRole.Free || role === UserRole.Trial) {
            presentActivationModal()
            return
          }
          toggleShowAISummaryOnce()
        },
      },
      {
        id: COMMAND_ID.entry.toggleAITranslation,
        label: t("entry_actions.toggle_ai_translation"),
        icon: <i className="i-mgc-translate-2-ai-cute-re" />,
        category,
        run: () => {
          if (role === UserRole.Free || role === UserRole.Trial) {
            presentActivationModal()
            return
          }
          toggleShowAITranslationOnce()
        },
      },
    ],
    {
      deps: [role],
    },
  )
}

export type TipCommand = Command<{
  id: typeof COMMAND_ID.entry.tip
  fn: (data: { userId?: string | null; feedId?: string; entryId?: string }) => void
}>

export type StarCommand = Command<{
  id: typeof COMMAND_ID.entry.star
  fn: (data: { entryId: string; view: FeedViewType }) => void
}>

export type DeleteCommand = Command<{
  id: typeof COMMAND_ID.entry.delete
  fn: (data: { entryId: string }) => void
}>

export type CopyLinkCommand = Command<{
  id: typeof COMMAND_ID.entry.copyLink
  fn: (data: { entryId: string }) => void
}>

export type ExportAsPDFCommand = Command<{
  id: typeof COMMAND_ID.entry.exportAsPDF
  fn: (data: { entryId: string }) => void
}>

export type CopyTitleCommand = Command<{
  id: typeof COMMAND_ID.entry.copyTitle
  fn: (data: { entryId: string }) => void
}>

export type OpenInBrowserCommand = Command<{
  id: typeof COMMAND_ID.entry.openInBrowser
  fn: (data: { entryId: string }) => void
}>

export type ViewSourceContentCommand = Command<{
  id: typeof COMMAND_ID.entry.viewSourceContent
  fn: (data: { entryId: string; siteUrl?: string | null | undefined }) => void
}>

export type ShareCommand = Command<{
  id: typeof COMMAND_ID.entry.share
  fn: (data: { entryId: string }) => void
}>

export type ReadCommand = Command<{
  id: typeof COMMAND_ID.entry.read
  fn: (data: { entryId: string }) => void
}>

export type ReadAboveCommand = Command<{
  id: typeof COMMAND_ID.entry.readAbove
  fn: (data: { publishedAt: string }) => void
}>

export type ReadBelowCommand = Command<{
  id: typeof COMMAND_ID.entry.readBelow
  fn: (data: { publishedAt: string }) => void
}>

export type ToggleAISummaryCommand = Command<{
  id: typeof COMMAND_ID.entry.toggleAISummary
  fn: () => void
}>

export type ToggleAITranslationCommand = Command<{
  id: typeof COMMAND_ID.entry.toggleAITranslation
  fn: () => void
}>

export type ImageGalleryCommand = Command<{
  id: typeof COMMAND_ID.entry.imageGallery
  fn: (data: { entryId: string }) => void
}>

export type TTSCommand = Command<{
  id: typeof COMMAND_ID.entry.tts
  fn: (data: { entryId: string }) => void
}>

export type ReadabilityCommand = Command<{
  id: typeof COMMAND_ID.entry.readability
  fn: (data: { entryId: string; entryUrl: string }) => void
}>

export type EntryCommand =
  | TipCommand
  | StarCommand
  | DeleteCommand
  | CopyLinkCommand
  | ExportAsPDFCommand
  | CopyTitleCommand
  | OpenInBrowserCommand
  | ViewSourceContentCommand
  | ShareCommand
  | ReadCommand
  | ReadAboveCommand
  | ReadBelowCommand
  | ToggleAISummaryCommand
  | ToggleAITranslationCommand
  | ImageGalleryCommand
  | TTSCommand
  | ReadabilityCommand
