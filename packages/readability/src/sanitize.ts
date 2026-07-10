import DOMPurify from "dompurify"
import { JSDOM } from "jsdom"

const youtubeEmbedRegex = /^https:\/\/(?:www\.)?(?:youtube\.com|youtube-nocookie\.com)\/embed\//

// For avoiding xss attack from readability, the raw document string should be sanitized.
// The xss attack in electron may lead to more serious outcomes than browser environment.
// It may allow remote execution of malicious scripts in the main process.
export function sanitizeHTMLString(dirtyDocumentString: string) {
  const { window } = new JSDOM("")
  const purify = DOMPurify(window)
  if (!purify.isSupported) {
    throw new Error("DOMPurify is not supported in the current DOM environment.")
  }

  // Keep YouTube embed iframes; any other iframe is still stripped.
  purify.addHook("uponSanitizeElement", (node, data) => {
    if (
      data.tagName === "iframe" &&
      !youtubeEmbedRegex.test((node as Element).getAttribute?.("src") ?? "")
    ) {
      node.parentNode?.removeChild(node)
    }
  })

  return purify.sanitize(dirtyDocumentString, { ADD_TAGS: ["iframe"] })
}
