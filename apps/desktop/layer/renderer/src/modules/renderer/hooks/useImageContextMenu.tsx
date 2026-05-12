import { SimpleIconsEagle } from "@follow/components/ui/platform-icon/icons.js"
import { IN_ELECTRON } from "@follow/shared/constants"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useEventCallback } from "usehooks-ts"

import { MenuItemText, useShowContextMenu } from "~/atoms/context-menu"
import { useIntegrationSettingKey } from "~/atoms/settings/integration"
import { ipcServices } from "~/lib/client"

import type { MarkdownRenderActions } from "../../../components/ui/markdown/types"

export const useImageContextMenu = (
  entryUrl?: Nullable<string>,
): NonNullable<MarkdownRenderActions["onImageContextMenu"]> => {
  const { t } = useTranslation()
  const showContextMenu = useShowContextMenu()
  const enableEagle = useIntegrationSettingKey("enableEagle")

  return useEventCallback(async (event, imageUrl) => {
    if (!IN_ELECTRON || !enableEagle || !ipcServices?.integration?.saveToEagle) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    await showContextMenu(
      [
        new MenuItemText({
          label: t("entry_actions.save_image_to_eagle"),
          icon: <SimpleIconsEagle />,
          click: async () => {
            const response = await ipcServices?.integration.saveToEagle({
              url: entryUrl || imageUrl,
              mediaUrls: [imageUrl],
            })

            if (response?.status === "success") {
              toast.success(t("entry_actions.saved_to_eagle"), {
                duration: 3000,
              })
            } else {
              toast.error(t("entry_actions.failed_to_save_to_eagle"), {
                duration: 3000,
              })
            }
          },
        }),
      ],
      event,
    )
  })
}
