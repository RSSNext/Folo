import { toast } from "sonner"

export const copyToClipboard = async (content: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(content)
  } catch (e) {
    const message = "Unable to copy to clipboard. Please ensure clipboard permissions are granted."
    console.error(e)
    toast.error(message)
    throw new Error(message)
  }
}

export const readFromClipboard = async (): Promise<string> => {
  try {
    return await navigator.clipboard.readText()
  } catch (e) {
    const message =
      "Unable to read from clipboard. Please ensure clipboard permissions are granted."
    toast.error(message)
    console.error(e)
    throw new Error(message)
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
        const message =
          "Unable to copy image to clipboard. Please ensure clipboard permissions are granted."
        console.error(e)
        toast.error(message)
        reject(new Error(message))
      }
    }, "image/png")
  })
}
