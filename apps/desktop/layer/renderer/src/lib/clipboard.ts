import { t } from "i18next"
import { toast } from "sonner"

// Thrown after the failure has already been shown to the user, so callers can skip their own toast
export class ClipboardError extends Error {}

export type ClipboardContent = string | (() => string | Promise<string>)

export const copyToClipboard = async (content: ClipboardContent): Promise<void> => {
  try {
    const resolvedContent = typeof content === "function" ? await content() : content
    await navigator.clipboard.writeText(resolvedContent)
  } catch (e) {
    const message = t("clipboard.copy_failed")
    console.error(e)
    toast.error(message)
    throw new ClipboardError(message)
  }
}

export const readFromClipboard = async (): Promise<string> => {
  try {
    return await navigator.clipboard.readText()
  } catch (e) {
    const message = t("clipboard.read_failed")
    toast.error(message)
    console.error(e)
    throw new ClipboardError(message)
  }
}

export const copyImageToClipboard = async (canvas: HTMLCanvasElement): Promise<void> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        const error = new Error("Failed to create image blob")
        reject(error)
        return
      }

      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob,
          }),
        ])
        resolve()
      } catch (e) {
        const message = t("clipboard.copy_image_failed")
        console.error(e)
        toast.error(message)
        reject(new ClipboardError(message))
      }
    }, "image/png")
  })
}
