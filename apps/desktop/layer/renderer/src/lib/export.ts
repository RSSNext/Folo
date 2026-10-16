import { IN_ELECTRON } from "@follow/shared/constants"

import { ipcServices } from "./client"

const PDF_EXTENSION = ".pdf"

const sanitizeFileName = (value: string) => {
  return Array.from(value)
    .map((character) => {
      const charCode = character.codePointAt(0) ?? 0

      if (`<>:"/\\|?*`.includes(character) || charCode <= 31) {
        return " "
      }

      return character
    })
    .join("")
}

/**
 * Save data under the given file name. Only a link to the app's own origin, such as this blob
 * URL, keeps the name; for a link to the API's origin the browser takes the server's name.
 */
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const downloadJsonFile = (content: string, filename: string) => {
  downloadBlob(new Blob([content], { type: "application/json" }), filename)
}

export const selectJsonFile = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json,application/json"
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) {
        reject(new Error("No file selected"))
        return
      }

      try {
        const content = await file.text()
        resolve(content)
      } catch {
        reject(new Error("Failed to read file"))
      }
    }
    input.click()
  })
}

export const createPdfFileName = (title?: string) => {
  const sanitizedTitle = title?.trim()
    ? sanitizeFileName(title.trim()).replaceAll(/\s+/g, " ").trim()
    : ""
  const baseName = sanitizedTitle || "Untitled"

  return baseName.toLowerCase().endsWith(PDF_EXTENSION) ? baseName : `${baseName}${PDF_EXTENSION}`
}

interface ExportPageAsPdfOptions {
  title?: string
  isElectron?: boolean
  print?: () => void
  exportAsPdf?: (input: { defaultPath: string }) => Promise<string | null>
}

export const exportPageAsPdf = async ({
  title,
  isElectron = IN_ELECTRON,
  print = () => {
    window.print()
  },
  exportAsPdf = async (input) => {
    if (!ipcServices) {
      throw new Error("Electron IPC is not available")
    }

    return ipcServices.app.exportCurrentPageAsPdf(input)
  },
}: ExportPageAsPdfOptions = {}) => {
  if (isElectron) {
    return exportAsPdf({ defaultPath: createPdfFileName(title) })
  }

  print()
  return null
}
