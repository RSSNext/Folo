import type { AIChatContextBlock, FileAttachment } from "~/modules/ai-chat/store/types"
import {
  getFileCategoryFromMimeType,
  getFileIconName,
} from "~/modules/ai-chat/utils/file-validation"

/**
 * Block style configurations for different context block types
 */
export const BLOCK_STYLES = {
  mainEntry: {
    container: "from-orange/5 to-orange/10 border-orange/20 hover:border-orange/30",
    icon: "bg-orange/10 text-orange",
    label: "text-orange",
  },
  referEntry: {
    container: "from-blue/5 to-blue/10 border-blue/20 hover:border-blue/30",
    icon: "bg-blue/10 text-blue",
    label: "text-blue",
  },
  referFeed: {
    container: "from-green/5 to-green/10 border-green/20 hover:border-green/30",
    icon: "bg-green/10 text-green",
    label: "text-green",
  },
  selectedText: {
    container: "from-purple/5 to-purple/10 border-purple/20 hover:border-purple/30",
    icon: "bg-purple/10 text-purple",
    label: "text-purple",
  },
  fileAttachment: {
    container: "from-pink/5 to-pink/10 border-pink/20 hover:border-pink/30",
    icon: "bg-pink/10 text-pink",
    label: "text-pink",
  },
} as const

/**
 * Default fallback styles for unknown block types
 */
export const DEFAULT_BLOCK_STYLES = {
  container: "from-gray/5 to-gray/10 border-gray/20 hover:border-gray/30",
  icon: "bg-gray/10 text-gray",
  label: "text-gray",
} as const

/**
 * Block icons for different context block types
 */
export const BLOCK_ICONS = {
  mainEntry: "i-mgc-star-cute-fi",
  referEntry: "i-mgc-paper-cute-fi",
  referFeed: "i-mgc-rss-cute-fi",
  selectedText: "i-mgc-quill-pen-cute-re",
  fileAttachment: "i-mgc-file-upload-cute-re",
} as const

/**
 * Block labels for different context block types
 */
export const BLOCK_LABELS = {
  mainEntry: "Current",
  referEntry: "Ref",
  referFeed: "Feed",
  selectedText: "Text",
  fileAttachment: "File",
} as const

/**
 * File upload status labels
 */
export const FILE_STATUS_LABELS = {
  uploading: "Uploading...",
  error: "Failed",
  processing: "Processing...",
  completed: "",
} as const

/**
 * Gets the appropriate styles for a block type
 */
export function getBlockStyles(type: AIChatContextBlock["type"]) {
  return BLOCK_STYLES[type] || DEFAULT_BLOCK_STYLES
}

/**
 * Gets the appropriate icon for a block
 */
export function getBlockIcon(block: AIChatContextBlock): string {
  if (block.type === "fileAttachment" && block.attachment) {
    const fileCategory = getFileCategoryFromMimeType(block.attachment.type)
    return getFileIconName(fileCategory)
  }
  return BLOCK_ICONS[block.type] || BLOCK_ICONS.fileAttachment
}

/**
 * Gets the appropriate label for a block type
 */
export function getBlockLabel(type: AIChatContextBlock["type"]): string {
  return BLOCK_LABELS[type] || ""
}

/**
 * Gets the best available image URL for a file attachment
 */
export function getImageUrl(attachment: FileAttachment): string | null {
  return attachment.previewUrl || attachment.dataUrl || attachment.serverUrl || null
}

/**
 * Checks if a block represents an image attachment
 */
export function isImageAttachment(block: AIChatContextBlock): boolean {
  return (
    block.type === "fileAttachment" &&
    !!block.attachment &&
    getFileCategoryFromMimeType(block.attachment.type) === "image"
  )
}

/**
 * Gets display content for file attachments based on upload status
 */
export function getFileDisplayContent(attachment: FileAttachment): string {
  const statusLabel = FILE_STATUS_LABELS[attachment.uploadStatus]
  return statusLabel || attachment.name
}
