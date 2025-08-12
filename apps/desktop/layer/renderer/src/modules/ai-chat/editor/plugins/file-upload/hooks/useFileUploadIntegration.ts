import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $insertNodes,
  $isElementNode,
} from "lexical"
import { useCallback } from "react"

import { useFileUploadWithDefaults } from "../../../../hooks/useFileUpload"
import { $createFileAttachmentNode } from "../FileAttachmentNode"

export function useFileUploadIntegration(
  onFileNodeInsert?: (attachmentId: string, nodeKey: string) => void,
) {
  const [editor] = useLexicalComposerContext()
  const { uploadFiles } = useFileUploadWithDefaults()

  const insertFileAttachmentNode = useCallback(
    (attachmentId: string) => {
      editor.update(() => {
        const selection = $getSelection()
        const root = $getRoot()

        const fileNode = $createFileAttachmentNode(attachmentId)

        if (selection) {
          // Insert at current selection
          $insertNodes([fileNode])
        } else {
          // No selection - append to the end
          const lastChild = root.getLastChild()
          if (lastChild && $isElementNode(lastChild)) {
            lastChild.append(fileNode)
          } else {
            // Create a paragraph and add the file node to it
            const paragraph = $createParagraphNode()
            paragraph.append(fileNode)
            root.append(paragraph)
          }
        }

        // Notify the sync handler
        const nodeKey = fileNode.getKey()
        if (onFileNodeInsert) {
          onFileNodeInsert(attachmentId, nodeKey)
        }
      })
    },
    [editor, onFileNodeInsert],
  )

  const handleMultipleFileUpload = useCallback(
    async (files: File[] | FileList) => {
      try {
        const results = await uploadFiles(files)

        // Insert successful uploads into the editor
        results.forEach((result) => {
          if (result.success && result.fileAttachment) {
            insertFileAttachmentNode(result.fileAttachment.id)
          }
        })
      } catch (error) {
        console.error("Multiple file upload failed:", error)
      }
    },
    [uploadFiles, insertFileAttachmentNode],
  )

  const handleFileDrop = useCallback(
    async (files: FileList) => {
      if (files && files.length > 0) {
        await handleMultipleFileUpload(files)
      }
    },
    [handleMultipleFileUpload],
  )

  const handlePaste = useCallback(
    async (clipboardData: DataTransfer) => {
      const files = Array.from(clipboardData.files)
      if (files.length > 0) {
        await handleMultipleFileUpload(files)
      }
    },
    [handleMultipleFileUpload],
  )

  return {
    handleMultipleFileUpload,
    handleFileDrop,
    handlePaste,
  }
}
