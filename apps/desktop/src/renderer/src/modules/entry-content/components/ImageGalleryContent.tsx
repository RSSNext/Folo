import type { MediaModel } from "@follow/models"

import { useEntry } from "~/store/entry"

import { ImageGallery } from "../actions/picture-gallery"

export const ImageGalleryContent = ({ entryId }: { entryId: string }) => {
  const images = useEntry(entryId, (entry) => entry.entries.media)
  if (images?.length) {
    return <ImageGallery images={images as any as MediaModel[]} />
  } else {
    return (
      <div className="flex size-full items-center justify-center text-zinc-500">
        <p className="text-sm">No images found in this entry</p>
      </div>
    )
  }
  return null
}
