import { parseHtml } from "@follow/utils/html"

/**
 * Feed descriptions are stored as the feed publishes them, so some carry HTML such as `<em>` or
 * `<br>`. Returns the text a reader would see, on one line for the short preview.
 */
export const getFeedDescriptionText = (description: string) => {
  // Most descriptions are plain text and need no parsing
  const text = /[<&]/.test(description) ? parseHtml(description).toText() : description
  return text.replaceAll(/\s+/g, " ").trim()
}
