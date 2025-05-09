import { FeedViewType, UserRole } from "@follow/constants"
import { IN_ELECTRON } from "@follow/shared/constants"
import { tracker } from "@follow/tracker"
import { resolveUrlWithBase } from "@follow/utils/utils"
import { t } from "i18next"
import { createElement } from "react"
import { toast } from "sonner"

import { toggleShowAISummaryOnce } from "~/atoms/ai-summary"
import { toggleShowAITranslationOnce } from "~/atoms/ai-translation"
import { AudioPlayer, getAudioPlayerAtomValue } from "~/atoms/player"
import { getGeneralSettings } from "~/atoms/settings/general"
import { getShowSourceContent, toggleShowSourceContent } from "~/atoms/source-content"
import { getUserRole } from "~/atoms/user"
import { toggleEntryReadability } from "~/hooks/biz/useEntryActions"
import { navigateEntry } from "~/hooks/biz/useNavigateEntry"
import { getRouteParams } from "~/hooks/biz/useRouteParams"
import { tipcClient } from "~/lib/client"
import { parseHtml } from "~/lib/parse-html"
import { ActivationModalContent } from "~/modules/activation/ActivationModalContent"
import { markAllByRoute } from "~/modules/entry-column/hooks/useMarkAll"
import { ImageGalleryContent } from "~/modules/entry-content/components/ImageGalleryContent"
import { SourceContentView } from "~/modules/entry-content/components/SourceContentView"
import { TipModalContent } from "~/modules/wallet/tip-modal"
import { entryActions, useEntryStore } from "~/store/entry"

import { COMMAND_ID } from "../commands/id"
import type {
  CopyLinkCommand,
  CopyTitleCommand,
  DeleteCommand,
  ExportAsPDFCommand,
  ImageGalleryCommand,
  OpenInBrowserCommand,
  ReadabilityCommand,
  ReadAboveCommand,
  ReadBelowCommand,
  ReadCommand,
  ShareCommand,
  StarCommand,
  TipCommand,
  ToggleAISummaryCommand,
  ToggleAITranslationCommand,
  TTSCommand,
  ViewSourceContentCommand,
} from "../commands/types"

class EntryCommandRunnerMap {
  [COMMAND_ID.entry.star]: StarCommand["run"] = async ({ entryId, view }) => {
    const entry = useEntryStore.getState().flatMapEntries[entryId]
    if (!entry) {
      toast.error("Failed to star: entry is not available", { duration: 3000 })
      return
    }

    if (entry.collections) {
      await entryActions.markStar(entryId, false)
      toast.success(t("entry_actions.starred"), {
        duration: 1000,
      })
    } else {
      await entryActions.markStar(entryId, true, view)
      toast.success(t("entry_actions.starred"), {
        duration: 1000,
      })
    }
  };

  [COMMAND_ID.entry.tip]: TipCommand["run"] = async ({ userId, feedId, entryId }) => {
    const present = window.presentModal

    if (!feedId || !entryId) {
      // this should not happen unless there is a bug in the code
      toast.error("Invalid feed id or entry id")
      return
    }
    tracker.tipModalOpened({ entryId })
    present({
      title: t("tip_modal.tip_title"),
      content: () => createElement(TipModalContent, { userId, feedId, entryId }),
    })
  };

  [COMMAND_ID.entry.delete]: DeleteCommand["run"] = async ({ entryId }) => {
    const entry = useEntryStore.getState().flatMapEntries[entryId]
    if (!entry) {
      toast.error("Failed to delete: entry is not available", { duration: 3000 })
      return
    }
    await entryActions
      .deleteInboxEntry(entry.entries.id)
      .then(() => {
        toast.success(t("entry_actions.deleted"))
      })
      .catch(() => {
        toast.error(t("entry_actions.failed_to_delete"))
      })
  };

  [COMMAND_ID.entry.copyLink]: CopyLinkCommand["run"] = async ({ entryId }) => {
    const entry = useEntryStore.getState().flatMapEntries[entryId]
    if (!entry) {
      toast.error("Failed to copy link: entry is not available", { duration: 3000 })
      return
    }
    if (!entry.entries.url) return
    navigator.clipboard.writeText(entry.entries.url)
    toast(t("entry_actions.copied_notify", { which: t("words.link") }), {
      duration: 1000,
    })
  };

  [COMMAND_ID.entry.exportAsPDF]: ExportAsPDFCommand["run"] = async ({ entryId }) => {
    const entry = useEntryStore.getState().flatMapEntries[entryId]
    if (!entry) {
      toast.error("Failed to export as pdf: entry is not available", { duration: 3000 })
      return
    }
    window.print()
  };

  [COMMAND_ID.entry.copyTitle]: CopyTitleCommand["run"] = async ({ entryId }) => {
    const entry = useEntryStore.getState().flatMapEntries[entryId]
    if (!entry) {
      toast.error("Failed to copy link: entry is not available", { duration: 3000 })
      return
    }
    if (!entry.entries.title) return
    navigator.clipboard.writeText(entry.entries.title)
    toast(t("entry_actions.copied_notify", { which: t("words.title") }), {
      duration: 1000,
    })
  };

  [COMMAND_ID.entry.openInBrowser]: OpenInBrowserCommand["run"] = async ({ entryId }) => {
    const entry = useEntryStore.getState().flatMapEntries[entryId]
    if (!entry || !entry.entries.url) {
      toast.error("Failed to open in browser: url is not available", { duration: 3000 })
      return
    }
    window.open(entry.entries.url, "_blank")
  };

  [COMMAND_ID.entry.viewSourceContent]: ViewSourceContentCommand["run"] = async ({
    entryId,
    siteUrl,
  }) => {
    if (!getShowSourceContent()) {
      const entry = useEntryStore.getState().flatMapEntries[entryId]
      if (!entry || !entry.entries.url) {
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
        const src = siteUrl ? resolveUrlWithBase(entry?.entries.url, siteUrl) : entry?.entries.url
        const title = entry.entries.title ?? undefined
        window.presentModal({
          title,

          content: () => createElement(SourceContentView, { src }),
          resizeable: true,
          clickOutsideToDismiss: true,
          max: true,
        })
        return
      }
      const layoutEntryId = routeParams.entryId
      if (layoutEntryId !== entry.entries.id) {
        navigateEntry({ entryId: entry.entries.id })
      }
    }
    toggleShowSourceContent()
  };

  [COMMAND_ID.entry.share]: ShareCommand["run"] = async ({ entryId }) => {
    const entry = useEntryStore.getState().flatMapEntries[entryId]
    if (!entry || !entry.entries.url) {
      toast.error("Failed to share: url is not available", { duration: 3000 })
      return
    }
    if (!entry.entries.url) return

    if (IN_ELECTRON) {
      return tipcClient?.showShareMenu(entry.entries.url)
    } else {
      const { title, description } = entry.entries
      navigator.share({
        title: title || undefined,
        text: description || undefined,
        url: entry.entries.url,
      })
    }
  };

  [COMMAND_ID.entry.readAbove]: ReadAboveCommand["run"] = async ({ publishedAt }) => {
    return markAllByRoute({
      startTime: new Date(publishedAt).getTime() + 1,
      endTime: Date.now(),
    })
  };

  [COMMAND_ID.entry.read]: ReadCommand["run"] = async ({ entryId }) => {
    const entry = useEntryStore.getState().flatMapEntries[entryId]
    if (!entry) {
      toast.error("Failed to mark as unread: feed is not available", { duration: 3000 })
      return
    }
    if (entry.read) {
      await entryActions.markRead({
        feedId: entry.feedId,
        entryId,
        read: false,
      })
    } else {
      await entryActions.markRead({
        feedId: entry.feedId,
        entryId,
        read: true,
      })
    }
  };

  [COMMAND_ID.entry.readBelow]: ReadBelowCommand["run"] = async ({ publishedAt }) => {
    return markAllByRoute({
      startTime: 1,
      endTime: new Date(publishedAt).getTime() - 1,
    })
  };

  [COMMAND_ID.entry.imageGallery]: ImageGalleryCommand["run"] = async ({ entryId }) => {
    // Access the gallery modal directly from the state
    if (!entryId) {
      // this should not happen unless there is a bug in the code
      toast.error("Invalid feed id")
      return
    }
    tracker.entryContentHeaderImageGalleryClick({
      feedId: entryId,
    })
    window.presentModal({
      title: t("entry_actions.image_gallery"),
      content: () => createElement(ImageGalleryContent, { entryId }),
      max: true,
      clickOutsideToDismiss: true,
    })
  };

  [COMMAND_ID.entry.tts]: TTSCommand["run"] = async ({ entryId, entryContent }) => {
    if (getAudioPlayerAtomValue().entryId === entryId) {
      AudioPlayer.togglePlayAndPause()
    } else {
      const { voice } = getGeneralSettings()
      const filePath = await tipcClient?.tts({
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
  };

  [COMMAND_ID.entry.readability]: ReadabilityCommand["run"] = async ({ entryId, entryUrl }) => {
    return toggleEntryReadability({
      id: entryId,
      url: entryUrl,
    })
  }

  private presentActivationModal = () => {
    window.presentModal({
      title: t("activation.title"),
      content: ActivationModalContent,
      id: "activation",
      autoFocus: false,
    })
  };

  [COMMAND_ID.entry.toggleAISummary]: ToggleAISummaryCommand["run"] = async () => {
    const role = getUserRole()
    if (role === UserRole.Trial) {
      this.presentActivationModal()
      return
    }
    toggleShowAISummaryOnce()
  };

  [COMMAND_ID.entry.toggleAITranslation]: ToggleAITranslationCommand["run"] = async () => {
    const role = getUserRole()
    if (role === UserRole.Trial) {
      this.presentActivationModal()
      return
    }
    toggleShowAITranslationOnce()
  }
}
export const EntryCommandRunner = new EntryCommandRunnerMap()
