import { nanoid } from "nanoid"

import { followApi } from "~/lib/api-client"

import type { FileAttachment } from "../store/types"
import type { FileValidationResult } from "./file-validation"
import { validateFile } from "./file-validation"

export interface ProcessFileOptions {
  maxImageWidth?: number
  maxImageHeight?: number
  imageQuality?: number
}

export interface ProcessFileResult {
  success: boolean
  fileAttachment?: FileAttachment
  error?: string
}

export async function processFile(
  file: File,
  options: ProcessFileOptions = {},
): Promise<ProcessFileResult> {
  const { maxImageWidth = 1920, maxImageHeight = 1080, imageQuality = 0.85 } = options

  // Validate file
  const validation: FileValidationResult = validateFile(file)
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.error?.message || "File validation failed",
    }
  }

  try {
    const fileId = nanoid()
    let dataUrl: string
    let previewUrl: string | undefined

    if (validation.fileInfo?.category === "image") {
      // Process image: compress and generate preview
      const processedImage = await processImage(file, {
        maxWidth: maxImageWidth,
        maxHeight: maxImageHeight,
        quality: imageQuality,
      })

      dataUrl = processedImage.dataUrl
      previewUrl = processedImage.previewUrl
    } else {
      // For non-images, just convert to data URL
      dataUrl = await fileToDataUrl(file)
    }

    const fileAttachment: FileAttachment = {
      id: fileId,
      name: file.name,
      type: file.type,
      size: file.size,
      dataUrl,
      previewUrl,
      uploadStatus: "completed",
    }

    return {
      success: true,
      fileAttachment,
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to process file: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

interface ProcessImageResult {
  dataUrl: string
  previewUrl: string
}

async function processImage(
  file: File,
  options: { maxWidth: number; maxHeight: number; quality: number },
): Promise<ProcessImageResult> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      reject(new Error("Could not get canvas context"))
      return
    }

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      const { maxWidth, maxHeight, quality } = options

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width *= ratio
        height *= ratio
      }

      // Set canvas dimensions
      canvas.width = width
      canvas.height = height

      // Draw and compress image
      ctx.drawImage(img, 0, 0, width, height)

      const dataUrl = canvas.toDataURL(file.type, quality)

      // Create smaller preview (thumbnail)
      const previewCanvas = document.createElement("canvas")
      const previewCtx = previewCanvas.getContext("2d")

      if (previewCtx) {
        const previewSize = 150
        const previewRatio = Math.min(previewSize / width, previewSize / height)
        previewCanvas.width = width * previewRatio
        previewCanvas.height = height * previewRatio

        previewCtx.drawImage(img, 0, 0, previewCanvas.width, previewCanvas.height)
        const previewUrl = previewCanvas.toDataURL(file.type, 0.7)

        resolve({ dataUrl, previewUrl })
      } else {
        resolve({ dataUrl, previewUrl: dataUrl })
      }
    }

    img.onerror = () => {
      reject(new Error("Failed to load image"))
    }

    img.src = URL.createObjectURL(file)
  })
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      resolve(reader.result as string)
    }

    reader.onerror = () => {
      reject(new Error("Failed to read file"))
    }

    reader.readAsDataURL(file)
  })
}

export async function processFileList(
  files: FileList,
  options?: ProcessFileOptions,
): Promise<ProcessFileResult[]> {
  const results: ProcessFileResult[] = []

  for (const file of files) {
    if (file) {
      const result = await processFile(file, options)
      results.push(result)
    }
  }

  return results
}

export function createFileAttachmentBlock(fileAttachment: FileAttachment) {
  return {
    id: fileAttachment.id,
    type: "fileAttachment" as const,
    attachment: fileAttachment,
  }
}

// Utility to clean up object URLs to prevent memory leaks
export function cleanupFileAttachment(fileAttachment: FileAttachment) {
  if (fileAttachment.previewUrl?.startsWith("blob:")) {
    URL.revokeObjectURL(fileAttachment.previewUrl)
  }
}

export async function uploadFileAttachment(
  fileAttachment: FileAttachment,
  onProgressUpdate?: (attachment: FileAttachment) => void,
): Promise<FileAttachment> {
  try {
    // Update status to uploading with 0% progress
    let currentAttachment: FileAttachment = {
      ...fileAttachment,
      uploadStatus: "uploading" as const,
      uploadProgress: 0,
    }
    onProgressUpdate?.(currentAttachment)

    const { dataUrl } = fileAttachment
    const blob = await fetch(dataUrl).then((r) => r.blob())

    // TODO: Replace with real progress tracking when followApi supports it
    // Currently followApi.upload.uploadChatAttachment doesn't provide progress callbacks
    // Future implementation could use XMLHttpRequest or a custom fetch wrapper

    // Simulate realistic progress updates during upload
    // This mimics a realistic upload progression pattern
    const progressInterval = setInterval(() => {
      if (currentAttachment.uploadProgress! < 85) {
        // Start faster, then slow down (realistic network behavior)
        const currentProgress = currentAttachment.uploadProgress || 0
        const increment =
          currentProgress < 50
            ? Math.random() * 20 + 5 // Fast initial progress
            : Math.random() * 8 + 2 // Slower progress as it approaches completion

        currentAttachment = {
          ...currentAttachment,
          uploadProgress: Math.min(85, currentProgress + increment),
        }
        onProgressUpdate?.(currentAttachment)
      }
    }, 150)

    try {
      // Actual upload
      const response = await followApi.upload.uploadChatAttachment({ file: blob })
      const serverUrl = response.data.url

      // Clear progress interval
      clearInterval(progressInterval)

      // Update to 100% and completed status
      const completedAttachment: FileAttachment = {
        ...fileAttachment,
        serverUrl,
        uploadStatus: "completed",
        uploadProgress: 100,
        errorMessage: undefined,
      }

      // Show 100% briefly before final callback
      onProgressUpdate?.(completedAttachment)

      return completedAttachment
    } catch (uploadError) {
      clearInterval(progressInterval)
      throw uploadError
    }
  } catch (error) {
    // Return attachment with error status
    const errorAttachment: FileAttachment = {
      ...fileAttachment,
      uploadStatus: "error",
      uploadProgress: undefined,
      errorMessage: error instanceof Error ? error.message : "Upload failed",
    }

    return errorAttachment
  }
}

export async function processAndUploadFile(
  file: File,
  options: ProcessFileOptions = {},
  onProgressUpdate?: (attachment: FileAttachment) => void,
): Promise<ProcessFileResult> {
  // First process the file locally
  const localResult = await processFile(file, options)

  if (!localResult.success || !localResult.fileAttachment) {
    return localResult
  }

  // Then upload to server
  const uploadedAttachment = await uploadFileAttachment(
    localResult.fileAttachment,
    onProgressUpdate,
  )

  return {
    success: uploadedAttachment.uploadStatus === "completed",
    fileAttachment: uploadedAttachment,
    error:
      uploadedAttachment.uploadStatus === "error" ? uploadedAttachment.errorMessage : undefined,
  }
}
