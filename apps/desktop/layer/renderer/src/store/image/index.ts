import type { EntryModel } from "@follow/models/types"

import { createZustandStore } from "../utils/helper"
import { getImageDimensionsFromDb } from "./db"

export interface StoreImageType {
  src: string
  width: number
  height: number
  ratio: number
  blurhash?: string
}
interface State {
  images: Record<string, StoreImageType>
}
export const useImageStore = createZustandStore<State>("image")(() => ({
  images: {},
}))

const set = useImageStore.setState
const get = useImageStore.getState

class ImageActions {
  getImage(src: string) {
    return get().images[src]
  }

  saveImages(images: StoreImageType[]) {
    set((state) => {
      const newImages = { ...state.images }
      for (const image of images) {
        newImages[image.src] = image
      }
      return { images: newImages }
    })
  }

  async fetchDimensionsFromDb(images: string[]) {
    const dims = (await Promise.all(images.map((image) => getImageDimensionsFromDb(image)))).filter(
      Boolean,
    ) as StoreImageType[]
    imageActions.saveImages(dims)
  }

  getImagesFromEntry(entry: EntryModel) {
    const images = [] as string[]
    if (!entry.media) return images
    for (const media of entry.media) {
      if (media.type === "photo") {
        images.push(media.url)
      }
    }
    return images
  }
}
export const imageActions = new ImageActions()
/// // HOOKS
export const useImageDimensions = (url: string) => useImageStore((state) => state.images[url])
export const useImagesHasDimensions = (urls?: string[]) =>
  useImageStore((state) => (urls ? urls?.every((url) => state.images[url]) : false))
