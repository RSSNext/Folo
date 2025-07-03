import { isTwitterUrl, isXUrl } from "@follow/utils/link-parser"

export const parseSocialMedia = (parsedUrl?: string | null) => {
  if (!parsedUrl) return

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
