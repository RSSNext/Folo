export const SUPPORTED_FILE_TYPES = {
  // Images
  "image/png": { extension: "png", category: "image", maxSize: 10 * 1024 * 1024 }, // 10MB
  "image/jpeg": { extension: "jpg", category: "image", maxSize: 10 * 1024 * 1024 },
  "image/jpg": { extension: "jpg", category: "image", maxSize: 10 * 1024 * 1024 },
  "image/webp": { extension: "webp", category: "image", maxSize: 10 * 1024 * 1024 },
  "image/gif": { extension: "gif", category: "image", maxSize: 10 * 1024 * 1024 },

  // Documents
  "application/pdf": { extension: "pdf", category: "document", maxSize: 25 * 1024 * 1024 }, // 25MB
  "text/plain": { extension: "txt", category: "text", maxSize: 1 * 1024 * 1024 }, // 1MB
  "text/markdown": { extension: "md", category: "text", maxSize: 1 * 1024 * 1024 },

  // Audio
  "audio/mpeg": { extension: "mp3", category: "audio", maxSize: 25 * 1024 * 1024 },
  "audio/wav": { extension: "wav", category: "audio", maxSize: 25 * 1024 * 1024 },
  "audio/mp4": { extension: "m4a", category: "audio", maxSize: 25 * 1024 * 1024 },
} as const

export type SupportedFileType = keyof typeof SUPPORTED_FILE_TYPES
export type FileCategory = (typeof SUPPORTED_FILE_TYPES)[SupportedFileType]["category"]

export interface FileValidationError {
  type: "unsupported" | "too_large" | "invalid"
  message: string
}

export interface FileValidationResult {
  isValid: boolean
  error?: FileValidationError
  fileInfo?: {
    type: SupportedFileType
    category: FileCategory
    extension: string
    maxSize: number
  }
}

export function validateFile(file: File): FileValidationResult {
  const fileType = file.type as SupportedFileType
  const fileInfo = SUPPORTED_FILE_TYPES[fileType]

  if (!fileInfo) {
    return {
      isValid: false,
      error: {
        type: "unsupported",
        message: `File type "${file.type}" is not supported. Supported types: images, PDFs, text files, and audio files.`,
      },
    }
  }

  if (file.size > fileInfo.maxSize) {
    const maxSizeMB = Math.round(fileInfo.maxSize / (1024 * 1024))
    const fileSizeMB = Math.round((file.size / (1024 * 1024)) * 100) / 100
    return {
      isValid: false,
      error: {
        type: "too_large",
        message: `File size (${fileSizeMB}MB) exceeds the maximum allowed size of ${maxSizeMB}MB for ${fileInfo.category} files.`,
      },
    }
  }

  if (file.size === 0) {
    return {
      isValid: false,
      error: {
        type: "invalid",
        message: "File appears to be empty or corrupted.",
      },
    }
  }

  return {
    isValid: true,
    fileInfo: {
      type: fileType,
      category: fileInfo.category,
      extension: fileInfo.extension,
      maxSize: fileInfo.maxSize,
    },
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function getFileCategoryFromMimeType(mimeType: string): FileCategory {
  // Images
  if (mimeType.startsWith("image/")) {
    return "image"
  }

  // Documents
  if (mimeType === "application/pdf") {
    return "document"
  }

  // Text files
  if (mimeType.startsWith("text/")) {
    return "text"
  }

  // Audio files
  if (mimeType.startsWith("audio/")) {
    return "audio"
  }

  // Default fallback
  return "image"
}

export function getFileIconName(category: FileCategory): string {
  switch (category) {
    case "image": {
      return "i-mgc-pic-cute-re"
    }
    case "document": {
      return "i-mgc-file-cute-re"
    }
    case "text": {
      return "i-mgc-document-cute-re"
    }
    case "audio": {
      return "i-mgc-voice-cute-re"
    }
    default: {
      return "i-mgc-attachment-cute-re"
    }
  }
}
