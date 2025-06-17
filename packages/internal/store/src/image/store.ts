import type { ImageSchema } from "@follow/database/schemas/types"
import { ImagesService } from "@follow/database/services/image"

import type { Hydratable } from "../internal/base"
import { createImmerSetter, createTransaction, createZustandStore } from "../internal/helper"

export type ImageModel = ImageSchema
type ImageStore = {
  images: Record<string, ImageModel>
}

export const useImagesStore = createZustandStore<ImageStore>("images")(() => ({
  images: {},
}))

const immerSet = createImmerSetter(useImagesStore)

class ImageActions implements Hydratable {
  async hydrate() {
    const images = await ImagesService.getImageAll()
    imageActions.upsertManyInSession(images)
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
