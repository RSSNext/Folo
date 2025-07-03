import { useCallback } from "react"

import { shareImage, useSaveImageToMediaLibrary } from "../ui/image/utils"
import ImageView from "./ImageViewing"
import { useLightbox, useLightboxControls } from "./lightboxState"

export function Lightbox() {
  const { activeLightbox } = useLightbox()
  const { closeLightbox } = useLightboxControls()

  const onClose = useCallback(() => {
    closeLightbox()
  }, [closeLightbox])

  const saveImageToAlbum = useSaveImageToMediaLibrary()

  return (
    <ImageView
      lightbox={activeLightbox}
      onRequestClose={onClose}
      onPressSave={saveImageToAlbum}
      onPressShare={(uri) => {
        shareImage({ uri })
      }}
    />
  )
}
