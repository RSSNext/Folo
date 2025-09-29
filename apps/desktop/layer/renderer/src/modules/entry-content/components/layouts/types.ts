/**
 * Shared props interface for all entry content layout components
 */
export interface EntryLayoutProps {
  entryId: string
  compact?: boolean
  noMedia?: boolean
  translation?: {
    content?: string
    title?: string
  }
}
