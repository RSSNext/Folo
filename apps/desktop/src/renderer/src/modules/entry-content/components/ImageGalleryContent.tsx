import { useEntry } from "~/store/entry"

import { ImageGallery } from "../actions/picture-gallery"

export const ImageGalleryContent = ({ entryId }: { entryId: string }) => {
  const images = useEntry(entryId, (entry) => entry.entries.media)
  // images?.length && images.length > 5
  // We don't need to check here, we already check in the action
  return <ImageGallery images={images} />
}
