// Import types from the mention-types file
import type { MentionData } from "../types/mention-types"

/**
 * DEPRECATED: Mention functionality has been moved to desktop app
 * These are stub functions to prevent breaking existing imports
 * Real implementation is now in apps/desktop/layer/renderer/src/modules/ai/chat/editor/plugins/mention/
 */

// Stub type for backward compatibility
type MentionNode = any

// Stub functions - all return empty/default values
export const $isMentionNode = (): boolean => false
export const $createMentionNode = (): null => null

export function $findMentionNodes(): MentionNode[] {
  return []
}

export function $getAllMentions(): MentionData[] {
  return []
}

export function $getMentionsByType(): MentionData[] {
  return []
}

export function $replaceMentionText(): boolean {
  return false
}

export function $insertMentionNode(): boolean {
  return false
}

export function $updateMentionData(): boolean {
  return false
}

export function $removeMentionNode(): boolean {
  return false
}

export function $getMentionAtCursor(): MentionData | null {
  return null
}

export function getMentionDisplayText(): string {
  return ""
}

export function parseMentionFromText(): MentionData | null {
  return null
}

export function validateMentionData(): boolean {
  return false
}

export function formatMentionForDisplay(): string {
  return ""
}

export function extractMentionsFromText(): MentionData[] {
  return []
}

export function $clearAllMentions(): boolean {
  return false
}

export function $highlightMentions(): void {
  // No-op
}

export function $addMentionAttributes(): void {
  // No-op
}

export function $removeMentionAttributes(): void {
  // No-op
}

export function createMentionTransformer() {
  return null
}

export function getMentionNodeByKey(): MentionNode | null {
  return null
}

export function $isMentionNodeSelected(): boolean {
  return false
}

export function $selectMentionNode(): boolean {
  return false
}

export function getMentionNodeText(): string {
  return ""
}

export function $updateMentionNodeText(): boolean {
  return false
}

export function validateMentionNodeData(): boolean {
  return false
}

export function serializeMentionNode(): string {
  return ""
}

export function deserializeMentionNode(): MentionNode | null {
  return null
}

export function $cloneMentionNode(): MentionNode | null {
  return null
}

export function compareMentionNodes(): boolean {
  return false
}

export function $findMentionNodeParent(): MentionNode | null {
  return null
}

export function $getMentionNodeChildren(): MentionNode[] {
  return []
}

export function $isMentionNodeEditable(): boolean {
  return false
}

export function $setMentionNodeEditable(): boolean {
  return false
}

export function getMentionNodeBoundingRect(): DOMRect | null {
  return null
}

export function $scrollToMentionNode(): boolean {
  return false
}

export function $focusMentionNode(): boolean {
  return false
}

export function $blurMentionNode(): boolean {
  return false
}

export function getMentionNodeElement(): HTMLElement | null {
  return null
}

export function $addMentionNodeEventListener(): () => void {
  return () => {}
}

export function $removeMentionNodeEventListener(): boolean {
  return false
}

export function createMentionNodeObserver(): { disconnect: () => void } {
  return { disconnect: () => {} }
}

export function $triggerMentionNodeEvent(): boolean {
  return false
}

export function getMentionNodeEventData(): any {
  return null
}

export function $syncMentionNodeData(): boolean {
  return false
}

export function $refreshMentionNode(): boolean {
  return false
}

export function getMentionNodeMetadata(): Record<string, any> {
  return {}
}

export function $setMentionNodeMetadata(): boolean {
  return false
}

export function $clearMentionNodeMetadata(): boolean {
  return false
}

export function exportMentionNodeData(): any {
  return null
}

export function importMentionNodeData(): boolean {
  return false
}

export function $createMentionFromSelection(): MentionNode | null {
  return null
}

export function $replaceMentionFromSelection(): boolean {
  return false
}

export function $getMentionFromSelection(): MentionData | null {
  return null
}

export function $clearMentionFromSelection(): boolean {
  return false
}
