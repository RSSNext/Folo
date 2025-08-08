import { useCallback } from "react"
import { toast } from "sonner"

import { useChatBlockActions } from "../store/hooks"
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
  uploadFile: (file: File) => Promise<ProcessFileResult>
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
    async (file: File): Promise<ProcessFileResult> => {
      try {
        const result = await processAndUploadFile(file, processOptions, (updatedAttachment) => {
          // Update block during upload progress
          blockActions.updateFileAttachment(updatedAttachment.id, updatedAttachment)
        })

        if (result.success && result.fileAttachment) {
          // Add the completed file attachment to blocks
          blockActions.addFileAttachment(result.fileAttachment)

          if (showSuccessToast) {
            toast.success(`${successMessage}: ${file.name}`)
          }
        } else if (showErrorToast && result.error) {
          toast.error(`${errorMessagePrefix}: ${result.error}`)
          console.error("File upload error:", result.error)
        }

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"

        if (showErrorToast) {
          toast.error(`${errorMessagePrefix}: ${errorMessage}`)
        }

        console.error("File upload failed:", error)

        return {
          success: false,
          error: errorMessage,
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
