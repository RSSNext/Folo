import { ActionButton } from "@follow/components/ui/button/index.js"
import type { MediaModel } from "@follow/models"
import { tracker } from "@follow/tracker"
import { useTranslation } from "react-i18next"

import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { useEntry } from "~/store/entry"

import { ImageGallery } from "./picture-gallery"

export const ImageGalleryAction = ({ id }: { id: string }) => {
  const { t } = useTranslation()
  const images = useEntry(id, (entry) => entry.entries.media)
  const { present } = useModalStack()
  if (images?.length && images.length > 5) {
    return (
      <ActionButton
        onClick={() => {
          tracker.entryContentHeaderImageGalleryClick({
            feedId: id,
          })
          present({
            title: t("entry_actions.image_gallery"),
            content: () => <ImageGallery images={images as any as MediaModel[]} />,
            max: true,
            clickOutsideToDismiss: true,
          })
        }}
        icon={<i className="i-mgc-pic-cute-fi" />}
        tooltip={t("entry_actions.image_gallery")}
      />
    )
  }
  return null
}
