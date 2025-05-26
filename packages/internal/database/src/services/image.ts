import { db } from "../db"
import { imagesTable } from "../schemas"
import type { ImageSchema } from "../schemas/types"
import type { Resetable } from "./internal/base"
import { conflictUpdateAllExcept } from "./internal/utils"

class ImageServiceStatic implements Resetable {
  async reset() {
    await db.delete(imagesTable).execute()
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

  async getImageAll() {
    return db.query.imagesTable.findMany()
  }
}

export const ImagesService = new ImageServiceStatic()
