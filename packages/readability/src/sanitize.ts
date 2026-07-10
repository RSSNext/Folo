import DOMPurify from "dompurify"
import { JSDOM } from "jsdom"

// For avoiding xss attack from readability, the raw document string should be sanitized.
// The xss attack in electron may lead to more serious outcomes than browser environment.
// It may allow remote execution of malicious scripts in the main process.
export function sanitizeHTMLString(dirtyDocumentString: string) {
  const { window } = new JSDOM("")
  const purify = DOMPurify(window)
  if (!purify.isSupported) {
    throw new Error("DOMPurify is not supported in the current DOM environment.")
  }

  return purify.sanitize(dirtyDocumentString)
}
