import type { ImageSchema } from "@follow/database/schemas/types"
import { ImagesService } from "@follow/database/services/image"

import type { Hydratable, Resetable } from "../../lib/base"
import { createImmerSetter, createTransaction, createZustandStore } from "../../lib/helper"

export type ImageModel = ImageSchema
type ImageStore = {
  images: Record<string, ImageModel>
}

const defaultState: ImageStore = {
  images: {},
}

export const useImagesStore = createZustandStore<ImageStore>("images")(() => defaultState)

const set = useImagesStore.setState
const immerSet = createImmerSetter(useImagesStore)

class ImageActions implements Hydratable, Resetable {
  async hydrate() {
    const images = await ImagesService.getImageAll()
    imageActions.upsertManyInSession(images)
  }

  async reset() {
    const tx = createTransaction()
    tx.store(() => {
      set(defaultState)
    })
    tx.persist(() => ImagesService.reset())
    await tx.run()
  }

  upsertManyInSession(images: ImageModel[]) {
    immerSet((state) => {
      for (const image of images) {
        state.images[image.url] = image
      }
    })
  }

  async upsertMany(images: ImageModel[]) {
    const tx = createTransaction()
    tx.store(() => this.upsertManyInSession(images))
    tx.persist(() => ImagesService.upsertMany(images))
    await tx.run()
  }
}

export const imageActions = new ImageActions()
