import type { FeedViewType } from "@follow/constants"
import type { Atom } from "jotai"
import { atom, useAtomValue } from "jotai"
import { createContext, use, useMemo } from "react"

import type { EntryListSource } from "@/src/modules/entry-content/entry-navigation/entry-list-source"

/** An entry opened from a list, with the list it was opened from */
export interface OpenedEntry {
  entryId: string
  entryIds?: string[]
  entryListSource?: EntryListSource
  view: FeedViewType
  isInbox?: boolean
}

interface EntrySplitContextValue {
  /** The entry the reader next to the list shows, which the list highlights */
  readingEntryIdAtom: Atom<string | null>
  openEntry: (entry: OpenedEntry) => void
}

/** Set while the list is shown next to the reader, which then opens the entries tapped in it */
export const EntrySplitContext = createContext<EntrySplitContextValue | null>(null)

interface EntrySplitPaneContextValue {
  /** Bottom space taken over the pane by the tab bar or the floating player bar */
  bottomInset: number
  /** The reader moved to another entry with its previous and next buttons */
  onReadingEntryChange: (entryId: string) => void
  /**
   * Changes each time the pane's screen is on top again after another screen covered it. That
   * screen may have shown another entry in the shared web view, so the reader shows its own again.
   */
  webViewResendSignal: number
}

/** Set for the reader shown next to the list rather than pushed over it */
export const EntrySplitPaneContext = createContext<EntrySplitPaneContextValue | null>(null)

const noReadingEntryIdAtom = atom<string | null>(null)

/** Whether the reader next to the list shows this entry */
export const useIsReadingEntry = (entryId: string) => {
  const readingEntryIdAtom = use(EntrySplitContext)?.readingEntryIdAtom ?? noReadingEntryIdAtom
  return useAtomValue(
    useMemo(
      () => atom((get) => get(readingEntryIdAtom) === entryId),
      [entryId, readingEntryIdAtom],
    ),
  )
}
