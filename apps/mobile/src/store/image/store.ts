import { getImageInfo } from "@follow/store/image/getters"
import { imageActions } from "@follow/store/image/store"
import ImageColors from "react-native-image-colors"

class ImageSyncService {
  async getColors(url?: string | null) {
    if (!url) {
      return
    }
    const existing = getImageInfo(url)?.colors
    if (existing) {
      return existing
    }

    const result = await ImageColors.getColors(url, { cache: true })
    await imageActions.upsertMany([{ url, colors: result }])
    return result
  }
}

export const imageSyncService = new ImageSyncService()
