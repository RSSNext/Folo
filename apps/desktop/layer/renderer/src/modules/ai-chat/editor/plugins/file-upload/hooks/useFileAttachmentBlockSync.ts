import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $getNodeByKey } from "lexical"
import { useCallback, useEffect, useRef } from "react"

import { useAIChatStore } from "~/modules/ai-chat/store/AIChatContext"
import { useChatBlockActions } from "~/modules/ai-chat/store/hooks"
import type { FileAttachmentContextBlock } from "~/modules/ai-chat/store/types"

import { $isFileAttachmentNode, FileAttachmentNode } from "../FileAttachmentNode"

interface FileAttachmentBlockReference {
  fileNodeKey: string
  blockId: string
  fileId: string // unique identifier for the file
}

/**
 * Hook that manages bidirectional synchronization between file attachment nodes and context blocks
 * - When a file attachment is added, corresponding block is created
 * - When a block is removed, corresponding file nodes are removed
 * - When a file node is removed, corresponding block is removed
 */
export const useFileAttachmentBlockSync = () => {
  const [editor] = useLexicalComposerContext()
  const blockActions = useChatBlockActions()
  const blocks = useAIChatStore()((state) => state.blocks)

  // Reference tracking maps
  const nodeToBlockRef = useRef<Map<string, FileAttachmentBlockReference>>(undefined!)
  if (!nodeToBlockRef.current) {
    nodeToBlockRef.current = new Map()
  }

  const fileToNodeRef = useRef<Map<string, Set<string>>>(undefined!)
  if (!fileToNodeRef.current) {
    fileToNodeRef.current = new Map()
  }

  const blockToFileRef = useRef<Map<string, string>>(undefined!)
  if (!blockToFileRef.current) {
    blockToFileRef.current = new Map()
  }

  // Add file attachment reference
  const addFileReference = useCallback(
    (attachmentId: string, fileNodeKey: string, blockId: string) => {
      const reference: FileAttachmentBlockReference = {
        fileNodeKey,
        blockId,
        fileId: attachmentId,
      }

      // Update tracking maps
      nodeToBlockRef.current.set(fileNodeKey, reference)

      if (!fileToNodeRef.current.has(attachmentId)) {
        fileToNodeRef.current.set(attachmentId, new Set())
      }
      fileToNodeRef.current.get(attachmentId)!.add(fileNodeKey)

      blockToFileRef.current.set(blockId, attachmentId)
    },
    [],
  )

  // Remove file attachment reference
  const removeFileReference = useCallback((fileNodeKey: string) => {
    const reference = nodeToBlockRef.current.get(fileNodeKey)
    if (!reference) return null

    const { fileId, blockId } = reference

    // Clean up tracking maps
    nodeToBlockRef.current.delete(fileNodeKey)

    const nodeSet = fileToNodeRef.current.get(fileId)
    if (nodeSet) {
      nodeSet.delete(fileNodeKey)
      if (nodeSet.size === 0) {
        fileToNodeRef.current.delete(fileId)
      }
    }

    blockToFileRef.current.delete(blockId)

    return reference
  }, [])

  // Handle file attachment insertion - create block and track reference
  const handleFileAttachmentInsert = useCallback(
    (attachmentId: string, fileNodeKey: string) => {
      // Check if block already exists for this file
      const existingBlock = blocks.find(
        (block): block is FileAttachmentContextBlock =>
          block.type === "fileAttachment" &&
          blockToFileRef.current.get(block.attachment.id) === attachmentId,
      )

      let blockId: string
      if (existingBlock) {
        // Use existing block
        blockId = existingBlock.id
      } else {
        // Find the file attachment in the current blocks state
        const currentBlocks = blockActions.getBlocks()
        const addedBlock = currentBlocks.find(
          (block): block is FileAttachmentContextBlock =>
            block.type === "fileAttachment" && block.attachment.id === attachmentId,
        )

        if (addedBlock) {
          blockId = addedBlock.id
        } else {
          // Fallback to a predictable ID pattern
          blockId = `fileAttachment-${attachmentId}-${fileNodeKey}`
        }
      }

      // Track the reference
      addFileReference(attachmentId, fileNodeKey, blockId)
    },
    [blocks, blockActions, addFileReference],
  )

  // Handle file attachment removal - remove block if no other nodes reference it
  const handleFileAttachmentRemove = useCallback(
    (fileNodeKey: string) => {
      const reference = removeFileReference(fileNodeKey)
      if (!reference) return

      const { fileId } = reference

      // Check if any other nodes still reference this file
      const remainingNodes = fileToNodeRef.current.get(fileId)
      if (!remainingNodes || remainingNodes.size === 0) {
        // No more nodes reference this file, remove the block
        blockActions.removeFileAttachment(fileId)
      }
    },
    [blockActions, removeFileReference],
  )

  // Handle block removal - remove corresponding file nodes
  const handleBlockRemove = useCallback(
    (blockId: string) => {
      const fileId = blockToFileRef.current.get(blockId)
      if (!fileId) return

      const nodeKeys = fileToNodeRef.current.get(fileId)
      if (!nodeKeys) return

      // Remove all file attachment nodes for this file
      editor.update(() => {
        Array.from(nodeKeys).forEach((nodeKey) => {
          const node = $getNodeByKey(nodeKey)
          if (node && $isFileAttachmentNode(node)) {
            node.remove()
          }
        })
      })

      // Clean up references
      Array.from(nodeKeys).forEach((nodeKey) => {
        removeFileReference(nodeKey)
      })
    },
    [editor, removeFileReference],
  )

  // Monitor block changes
  useEffect(() => {
    const currentBlockIds = new Set(blocks.map((block) => block.id))
    const trackedBlockIds = new Set(blockToFileRef.current.keys())

    // Find removed blocks
    for (const trackedBlockId of trackedBlockIds) {
      if (!currentBlockIds.has(trackedBlockId)) {
        handleBlockRemove(trackedBlockId)
      }
    }
  }, [blocks, handleBlockRemove])

  // Monitor file attachment node changes using mutation observer
  useEffect(() => {
    const removedNodeKeys = new Set<string>()

    const unregisterMutationListener = editor.registerMutationListener(
      FileAttachmentNode,
      (mutatedNodes) => {
        for (const [nodeKey, mutation] of mutatedNodes) {
          // Only track destroyed mutations for nodes we're actually tracking
          if (mutation === "destroyed" && nodeToBlockRef.current.has(nodeKey)) {
            removedNodeKeys.add(nodeKey)
          }
        }

        // Process removed nodes in next tick to avoid state conflicts
        if (removedNodeKeys.size > 0) {
          const timeoutId = setTimeout(() => {
            Array.from(removedNodeKeys).forEach((nodeKey) => {
              handleFileAttachmentRemove(nodeKey)
            })
            removedNodeKeys.clear()
          }, 100)

          return () => clearTimeout(timeoutId)
        }
      },
    )

    return unregisterMutationListener
  }, [editor, handleFileAttachmentRemove])

  // Cleanup on unmount
  useEffect(() => {
    const nodeToBlock = nodeToBlockRef.current
    const fileToNode = fileToNodeRef.current
    const blockToFile = blockToFileRef.current

    return () => {
      nodeToBlock.clear()
      fileToNode.clear()
      blockToFile.clear()
    }
  }, [])

  return {
    handleFileAttachmentInsert,
    handleFileAttachmentRemove,
  }
}
