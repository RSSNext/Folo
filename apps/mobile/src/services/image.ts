import { db } from "@follow/database/src/db"
import { imagesTable } from "@follow/database/src/schemas"
import type { ImageSchema } from "@follow/database/src/schemas/types"

import { imageActions } from "../store/image/store"
import type { Hydratable, Resetable } from "./internal/base"
import { conflictUpdateAllExcept } from "./internal/utils"

class ImageServiceStatic implements Hydratable, Resetable {
  async reset() {
    await db.delete(imagesTable).execute()
  }
  async hydrate() {
    const images = await db.query.imagesTable.findMany()
    imageActions.upsertManyInSession(images)
  }

  async upsertMany(imageColors: ImageSchema[]) {
    if (imageColors.length === 0) return
    await db
      .insert(imagesTable)
      .values(imageColors)
      .onConflictDoUpdate({
        target: [imagesTable.url],
        set: conflictUpdateAllExcept(imagesTable, ["url"]),
      })
  }
}

export const ImagesService = new ImageServiceStatic()
