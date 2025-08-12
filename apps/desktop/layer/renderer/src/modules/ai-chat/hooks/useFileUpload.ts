import { nanoid } from "nanoid"
import { useCallback } from "react"
import { toast } from "sonner"

import { useChatBlockActions } from "../store/hooks"
import type { FileAttachment } from "../store/types"
import type { ProcessFileOptions, ProcessFileResult } from "../utils/file-processing"
import { processAndUploadFile } from "../utils/file-processing"

export interface UseFileUploadOptions extends ProcessFileOptions {
  /**
   * Show success toast on successful upload
   */
  showSuccessToast?: boolean
  /**
   * Show error toast on upload failure
   */
  showErrorToast?: boolean
  /**
   * Custom success message for toast
   */
  successMessage?: string
  /**
   * Custom error message prefix for toast
   */
  errorMessagePrefix?: string
}

export interface FileUploadHandlers {
  /**
   * Upload a single file with progress tracking
   */
  uploadFile: (file: File, id?: string) => Promise<ProcessFileResult>
  /**
   * Upload multiple files with progress tracking
   */
  uploadFiles: (files: File[] | FileList) => Promise<ProcessFileResult[]>
  /**
   * Handle file input change event
   */
  handleFileInputChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  /**
   * Handle drag and drop files
   */
  handleFileDrop: (files: FileList) => Promise<void>
}

/**
 * Hook for handling file uploads with progress tracking and block management
 */
export function useFileUpload(options: UseFileUploadOptions = {}): FileUploadHandlers {
  const {
    showSuccessToast = false,
    showErrorToast = true,
    successMessage = "File uploaded successfully",
    errorMessagePrefix = "File upload error",
    ...processOptions
  } = options

  const blockActions = useChatBlockActions()

  const uploadFile = useCallback(
    async (file: File, id?: string): Promise<ProcessFileResult> => {
      // Create initial file attachment for immediate UI feedback
      const initialFileAttachment: FileAttachment = {
        id: id || nanoid(),
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: "", // Will be filled during processing
        uploadStatus: "processing",
        uploadProgress: 0,
      }

      // Add the initial block immediately for real-time UI feedback
      blockActions.addFileAttachment(initialFileAttachment)

      try {
        const result = await processAndUploadFile(file, processOptions, (updatedAttachment) => {
          // Update the attachment with the same ID to maintain consistency
          const syncedAttachment = {
            ...updatedAttachment,
            id: initialFileAttachment.id, // Keep the same ID
          }
          blockActions.updateFileAttachment(initialFileAttachment.id, syncedAttachment)
        })

        if (result.success && result.fileAttachment) {
          // Update the final completed state with the same ID
          const finalAttachment = {
            ...result.fileAttachment,
            id: initialFileAttachment.id, // Keep the same ID
          }

          blockActions.updateFileAttachment(initialFileAttachment.id, finalAttachment)

          if (showSuccessToast) {
            toast.success(`${successMessage}: ${file.name}`)
          }

          // Return result with consistent ID
          return {
            ...result,
            fileAttachment: finalAttachment,
          }
        } else {
          // Update to error state
          const errorAttachment: FileAttachment = {
            ...initialFileAttachment,
            uploadStatus: "error",
            errorMessage: result.error || "Upload failed",
            uploadProgress: undefined,
          }

          blockActions.updateFileAttachment(initialFileAttachment.id, errorAttachment)

          if (showErrorToast && result.error) {
            toast.error(`${errorMessagePrefix}: ${result.error}`)
          }

          return {
            ...result,
            fileAttachment: errorAttachment,
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"

        // Update to error state
        const errorAttachment: FileAttachment = {
          ...initialFileAttachment,
          uploadStatus: "error",
          errorMessage,
          uploadProgress: undefined,
        }

        blockActions.updateFileAttachment(initialFileAttachment.id, errorAttachment)

        if (showErrorToast) {
          toast.error(`${errorMessagePrefix}: ${errorMessage}`)
        }

        console.error("File upload failed:", error)

        return {
          success: false,
          error: errorMessage,
          fileAttachment: errorAttachment,
        }
      }
    },
    [
      blockActions,
      processOptions,
      showSuccessToast,
      showErrorToast,
      successMessage,
      errorMessagePrefix,
    ],
  )

  const uploadFiles = useCallback(
    async (files: File[] | FileList): Promise<ProcessFileResult[]> => {
      const results: ProcessFileResult[] = []
      const fileArray = Array.from(files)

      // Process files sequentially to avoid overwhelming the server
      for (const file of fileArray) {
        const result = await uploadFile(file)
        results.push(result)
      }

      return results
    },
    [uploadFile],
  )

  const handleFileInputChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = event.target
      if (files && files.length > 0) {
        await uploadFiles(files)
      }
      // Reset file input
      event.target.value = ""
    },
    [uploadFiles],
  )

  const handleFileDrop = useCallback(
    async (files: FileList) => {
      if (files && files.length > 0) {
        await uploadFiles(files)
      }
    },
    [uploadFiles],
  )

  return {
    uploadFile,
    uploadFiles,
    handleFileInputChange,
    handleFileDrop,
  }
}

/**
 * Convenience hook for file upload with default settings
 */
export function useFileUploadWithDefaults(): FileUploadHandlers {
  return useFileUpload({
    showErrorToast: true,
    showSuccessToast: false,
  })
}
