import type { EntryModel } from "@follow/models/types"
import { isTwitterUrl, isXUrl } from "@follow/utils/link-parser"

export const parseSocialMedia = (entry: EntryModel) => {
  const { authorUrl, url, guid } = entry

  const parsedUrl = authorUrl || url || guid
  const isX = isXUrl(parsedUrl).validate || isTwitterUrl(parsedUrl).validate

  if (isX) {
    return {
      type: "x",
      meta: {
        handle: new URL(parsedUrl).pathname.split("/").pop(),
      },
    }
  }
}
