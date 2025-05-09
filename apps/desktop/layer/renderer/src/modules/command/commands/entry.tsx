import { IN_ELECTRON } from "@follow/shared/constants"
import { cn } from "@follow/utils/utils"
import { useTranslation } from "react-i18next"

import { useIsInMASReview } from "~/atoms/server-configs"
import { useUserRole } from "~/atoms/user"

import { useRegisterFollowCommand } from "../hooks/use-register-command"
import { EntryCommandRunner } from "../runner/entry"
import { COMMAND_ID } from "./id"

export const useRegisterEntryCommands = () => {
  const { t } = useTranslation()

  const role = useUserRole()

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
              // keyBinding: shortcuts.entry.tip.key,
              // when: !isInbox && feed?.ownerUserId !== whoami()?.id && !!populatedEntry,
              run: EntryCommandRunner[COMMAND_ID.entry.tip],
            },
          ]),
      {
        id: COMMAND_ID.entry.star,
        label: t("entry_actions.star"),
        icon: (props) => (
          <i
            className={cn(
              props?.isActive ? "i-mgc-star-cute-fi text-orange-500" : "i-mgc-star-cute-re",
            )}
          />
        ),

        run: EntryCommandRunner[COMMAND_ID.entry.star],
      },
      {
        id: COMMAND_ID.entry.delete,
        label: t("entry_actions.delete"),
        icon: <i className="i-mgc-delete-2-cute-re" />,

        run: EntryCommandRunner[COMMAND_ID.entry.delete],
      },
      {
        id: COMMAND_ID.entry.copyLink,
        label: t("entry_actions.copy_link"),
        icon: <i className="i-mgc-link-cute-re" />,
        run: EntryCommandRunner[COMMAND_ID.entry.copyLink],
      },
      {
        id: COMMAND_ID.entry.exportAsPDF,
        label: t("entry_actions.export_as_pdf"),
        icon: <i className="i-mgc-pdf-cute-re" />,
        run: EntryCommandRunner[COMMAND_ID.entry.exportAsPDF],
      },
      {
        id: COMMAND_ID.entry.copyTitle,
        label: t("entry_actions.copy_title"),
        icon: <i className="i-mgc-copy-cute-re" />,
        run: EntryCommandRunner[COMMAND_ID.entry.copyTitle],
      },
      {
        id: COMMAND_ID.entry.openInBrowser,
        label: t("entry_actions.open_in_browser", {
          which: t(IN_ELECTRON ? "words.browser" : "words.newTab"),
        }),
        icon: <i className="i-mgc-world-2-cute-re" />,
        run: EntryCommandRunner[COMMAND_ID.entry.openInBrowser],
      },
      {
        id: COMMAND_ID.entry.viewSourceContent,
        label: t("entry_actions.view_source_content"),
        icon: <i className="i-mgc-web-cute-re" />,
        run: EntryCommandRunner[COMMAND_ID.entry.viewSourceContent],
      },
      {
        id: COMMAND_ID.entry.share,
        label: t("entry_actions.share"),
        icon: <i className="i-mgc-share-forward-cute-re" />,
        run: EntryCommandRunner[COMMAND_ID.entry.share],
      },
      {
        id: COMMAND_ID.entry.readAbove,
        label: t("entry_actions.mark_above_as_read"),
        run: EntryCommandRunner[COMMAND_ID.entry.readAbove],
      },
      {
        id: COMMAND_ID.entry.read,
        label: t("entry_actions.mark_as_read"),
        icon: (props) => (
          <i className={cn(props?.isActive ? "i-mgc-round-cute-re" : "i-mgc-round-cute-fi")} />
        ),
        run: EntryCommandRunner[COMMAND_ID.entry.read],
      },
      {
        id: COMMAND_ID.entry.readBelow,
        label: t("entry_actions.mark_below_as_read"),
        run: EntryCommandRunner[COMMAND_ID.entry.readBelow],
      },
      {
        id: COMMAND_ID.entry.imageGallery,
        label: t("entry_actions.image_gallery"),
        icon: <i className="i-mgc-pic-cute-fi" />,
        run: EntryCommandRunner[COMMAND_ID.entry.imageGallery],
      },
      {
        id: COMMAND_ID.entry.tts,
        label: t("entry_content.header.play_tts"),
        icon: <i className="i-mgc-voice-cute-re" />,
        run: EntryCommandRunner[COMMAND_ID.entry.tts],
      },
      {
        id: COMMAND_ID.entry.readability,
        label: {
          title: t("entry_content.header.readability"),
          description: t("entry_content.header.readability_description"),
        },
        icon: (props) => (
          <i className={props?.isActive ? "i-mgc-docment-cute-fi" : "i-mgc-docment-cute-re"} />
        ),
        run: EntryCommandRunner[COMMAND_ID.entry.readability],
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
        run: EntryCommandRunner[COMMAND_ID.entry.toggleAISummary],
      },
      {
        id: COMMAND_ID.entry.toggleAITranslation,
        label: t("entry_actions.toggle_ai_translation"),
        icon: <i className="i-mgc-translate-2-ai-cute-re" />,
        run: EntryCommandRunner[COMMAND_ID.entry.toggleAITranslation],
      },
    ],
    {
      deps: [role],
    },
  )
}
