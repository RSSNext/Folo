import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $getNodeByKey } from "lexical"
import { useCallback, useEffect, useRef } from "react"

import { useAIChatStore } from "~/modules/ai-chat/store/AIChatContext"
import { useChatBlockActions } from "~/modules/ai-chat/store/hooks"
import type { AIChatContextBlock, ValueContextBlock } from "~/modules/ai-chat/store/types"

import { $isMentionNode, MentionNode } from "../MentionNode"
import type { MentionData } from "../types"

interface MentionBlockReference {
  mentionNodeKey: string
  blockId: string
  resourceId: string // `${type}:${value}`
  mentionData: MentionData
}

const getResourceId = (type: string, value: string) => `${type}:${value}`

const getBlockType = (mentionType: string): ValueContextBlock["type"] => {
  return mentionType === "feed" ? "referFeed" : "referEntry"
}

/**
 * Hook that manages bidirectional synchronization between mention nodes and context blocks
 * - When a mention is added, corresponding block is created
 * - When a block is removed, corresponding mentions are removed
 * - When a mention is removed, corresponding block is removed (if no other mentions reference it)
 */
export const useMentionBlockSync = () => {
  const [editor] = useLexicalComposerContext()
  const blockActions = useChatBlockActions()
  const blocks = useAIChatStore()((state) => state.blocks)

  // Reference tracking maps
  const mentionToBlockRef = useRef(new Map<string, MentionBlockReference>()) // mentionNodeKey -> reference
  const resourceToMentionsRef = useRef(new Map<string, Set<string>>()) // resourceId -> Set<mentionNodeKey>
  const blockToResourceRef = useRef(new Map<string, string>()) // blockId -> resourceId

  // Add mention-block reference
  const addMentionReference = useCallback(
    (mentionData: MentionData, mentionNodeKey: string, blockId: string) => {
      const resourceId = getResourceId(mentionData.type, mentionData.value as string)

      const reference: MentionBlockReference = {
        mentionNodeKey,
        blockId,
        resourceId,
        mentionData,
      }

      // Update tracking maps
      mentionToBlockRef.current.set(mentionNodeKey, reference)

      if (!resourceToMentionsRef.current.has(resourceId)) {
        resourceToMentionsRef.current.set(resourceId, new Set())
      }
      resourceToMentionsRef.current.get(resourceId)!.add(mentionNodeKey)

      blockToResourceRef.current.set(blockId, resourceId)
    },
    [],
  )

  // Remove mention reference
  const removeMentionReference = useCallback((mentionNodeKey: string) => {
    const reference = mentionToBlockRef.current.get(mentionNodeKey)
    if (!reference) return null

    const { resourceId, blockId } = reference

    // Clean up tracking maps
    mentionToBlockRef.current.delete(mentionNodeKey)

    const mentionSet = resourceToMentionsRef.current.get(resourceId)
    if (mentionSet) {
      mentionSet.delete(mentionNodeKey)
      if (mentionSet.size === 0) {
        resourceToMentionsRef.current.delete(resourceId)
      }
    }

    blockToResourceRef.current.delete(blockId)

    return reference
  }, [])

  // Handle mention insertion - create block and track reference
  const handleMentionInsert = useCallback(
    (mentionData: MentionData, mentionNodeKey: string) => {
      const resourceId = getResourceId(mentionData.type, mentionData.value as string)

      // Check if block already exists for this resource
      const existingBlock = blocks.find(
        (block) => blockToResourceRef.current.get(block.id) === resourceId,
      )

      let blockId: string
      if (existingBlock) {
        // Use existing block
        blockId = existingBlock.id
      } else {
        // Create new block
        const blockType = getBlockType(mentionData.type)

        // Generate block ID (mimicking the block slice logic)
        const newBlock: Omit<ValueContextBlock, "id"> = {
          type: blockType,
          value: mentionData.value as string,
        }

        blockActions.addBlock(newBlock)

        // Use current blocks state directly from store instead of stale closure
        const currentBlocks = blockActions.getBlocks()
        const addedBlock = currentBlocks.find(
          (block): block is Extract<AIChatContextBlock, { type: typeof blockType }> =>
            block.type === blockType && block.value === mentionData.value,
        )

        if (addedBlock) {
          blockId = addedBlock.id
        } else {
          // Fallback to a predictable ID pattern if we can't find the block immediately
          blockId = `${blockType}-${mentionData.value}-${mentionNodeKey}`
        }
      }

      // Track the reference
      addMentionReference(mentionData, mentionNodeKey, blockId)
    },
    [blocks, blockActions, addMentionReference],
  )

  // Handle mention removal - remove block if no other mentions reference it
  const handleMentionRemove = useCallback(
    (mentionNodeKey: string) => {
      const reference = removeMentionReference(mentionNodeKey)
      if (!reference) return

      const { resourceId, blockId } = reference

      // Check if any other mentions still reference this resource
      const remainingMentions = resourceToMentionsRef.current.get(resourceId)
      if (!remainingMentions || remainingMentions.size === 0) {
        // No more mentions reference this resource, remove the block

        blockActions.removeBlock(blockId)
      }
    },
    [blockActions, removeMentionReference],
  )

  // Handle block removal - remove corresponding mentions
  const handleBlockRemove = useCallback(
    (blockId: string) => {
      const resourceId = blockToResourceRef.current.get(blockId)
      if (!resourceId) return

      const mentionKeys = resourceToMentionsRef.current.get(resourceId)
      if (!mentionKeys) return

      // Remove all mention nodes for this resource
      editor.update(() => {
        Array.from(mentionKeys).forEach((mentionKey) => {
          const node = $getNodeByKey(mentionKey)
          if (node && $isMentionNode(node)) {
            node.remove()
          }
        })
      })

      // Clean up references
      Array.from(mentionKeys).forEach((mentionKey) => {
        removeMentionReference(mentionKey)
      })
    },
    [editor, removeMentionReference],
  )

  // Monitor block changes
  useEffect(() => {
    const currentBlockIds = new Set(blocks.map((block) => block.id))
    const trackedBlockIds = new Set(blockToResourceRef.current.keys())

    // Find removed blocks
    for (const trackedBlockId of trackedBlockIds) {
      if (!currentBlockIds.has(trackedBlockId)) {
        handleBlockRemove(trackedBlockId)
      }
    }
  }, [blocks, handleBlockRemove])

  // Monitor mention node changes using mutation observer
  useEffect(() => {
    const removedMentionKeys = new Set<string>()

    const unregisterMutationListener = editor.registerMutationListener(
      MentionNode,
      (mutatedNodes) => {
        for (const [nodeKey, mutation] of mutatedNodes) {
          // Only track destroyed mutations for mentions we're actually tracking
          if (mutation === "destroyed" && mentionToBlockRef.current.has(nodeKey)) {
            removedMentionKeys.add(nodeKey)
          }
        }

        // Process removed mentions in next tick to avoid state conflicts
        if (removedMentionKeys.size > 0) {
          const timeoutId = setTimeout(() => {
            Array.from(removedMentionKeys).forEach((mentionKey) => {
              handleMentionRemove(mentionKey)
            })
            removedMentionKeys.clear()
          }, 100) // Increase delay to avoid race conditions

          // Store timeout ID for potential cleanup
          return () => clearTimeout(timeoutId)
        }
      },
    )

    return unregisterMutationListener
  }, [editor, handleMentionRemove])

  // Cleanup on unmount
  useEffect(() => {
    const mentionToBlock = mentionToBlockRef.current
    const resourceToMentions = resourceToMentionsRef.current
    const blockToResource = blockToResourceRef.current

    return () => {
      mentionToBlock.clear()
      resourceToMentions.clear()
      blockToResource.clear()
    }
  }, [])

  return {
    handleMentionInsert,
    handleMentionRemove,
    // Debug helpers
    getMentionReferences: () => ({
      mentionToBlock: new Map(mentionToBlockRef.current),
      resourceToMentions: new Map(resourceToMentionsRef.current),
      blockToResource: new Map(blockToResourceRef.current),
    }),
  }
}
