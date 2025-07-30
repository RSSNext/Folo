import { useEntry, useEntryIdsByFeedId, useEntryIdsByView } from "@follow/store/entry/hooks"
import { useEntryStore } from "@follow/store/entry/store"
import { getFeedById } from "@follow/store/feed/getter"
import { useFeedById } from "@follow/store/feed/hooks"
import { useAllFeedSubscription } from "@follow/store/subscription/hooks"
import { stopPropagation } from "@follow/utils"
import { cn } from "@follow/utils/utils"
import Fuse from "fuse.js"
import type { FC } from "react"
import { memo, useMemo, useState } from "react"
import { useDebounceCallback } from "usehooks-ts"

import { useAISettingValue } from "~/atoms/settings/ai"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu/dropdown-menu"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { useAIChatStore } from "~/modules/ai/chat/__internal__/AIChatContext"
import type { AIChatContextBlock } from "~/modules/ai/chat/__internal__/types"

import { useChatBlockActions } from "../__internal__/hooks"

export const AIChatContextBar: Component<{ onSendShortcut?: (prompt: string) => void }> = memo(
  ({ className, onSendShortcut }) => {
    const blocks = useAIChatStore()((s) => s.blocks)
    const blockActions = useChatBlockActions()
    const { shortcuts } = useAISettingValue()

    // Filter enabled shortcuts
    const enabledShortcuts = useMemo(
      () => shortcuts.filter((shortcut) => shortcut.enabled),
      [shortcuts],
    )

    const contextMenuContent = (
      <DropdownMenuContent align="start">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <i className="i-mgc-paper-cute-fi mr-1.5 size-4" />
            Current Feed Entries
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <CurrentFeedEntriesPickerList
              onSelect={(entryId) =>
                blockActions.addBlock({
                  type: "referEntry",
                  value: entryId,
                })
              }
            />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <i className="i-mgc-paper-cute-fi mr-1.5 size-4" />
            Reference Entry
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <RecentEntriesPickerList
              onSelect={(entryId) =>
                blockActions.addBlock({
                  type: "referEntry",
                  value: entryId,
                })
              }
            />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <i className="i-mgc-rss-cute-fi mr-1.5 size-4" />
            Reference Feed
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <FeedPickerList
              onSelect={(feedId) =>
                blockActions.addBlock({
                  type: "referFeed",
                  value: feedId,
                })
              }
            />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    )

    const shortcutsMenuContent = (
      <DropdownMenuContent align="start">
        {enabledShortcuts.length === 0 ? (
          <div className="text-text-tertiary p-3 text-center text-xs">No shortcuts configured</div>
        ) : (
          enabledShortcuts.map((shortcut) => (
            <DropdownMenuItem
              key={shortcut.id}
              onClick={() => onSendShortcut?.(shortcut.prompt)}
              className="text-xs"
              shortcut={shortcut.hotkey}
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="i-mgc-magic-2-cute-re size-3.5" />
                  <span className="truncate">{shortcut.name}</span>
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    )

    return (
      <div className={cn("flex flex-wrap items-center gap-2 px-4 py-3", className)}>
        {/* Add Context Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="bg-fill-secondary hover:bg-fill-tertiary border-border text-text-tertiary hover:text-text-secondary flex size-7 items-center justify-center rounded-md border transition-colors"
            >
              <i className="i-mgc-add-cute-re size-3.5" />
            </button>
          </DropdownMenuTrigger>
          {contextMenuContent}
        </DropdownMenu>

        {/* AI Shortcuts Button */}
        {enabledShortcuts.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="bg-fill-secondary hover:bg-fill-tertiary border-border text-text-tertiary hover:text-text-secondary flex size-7 items-center justify-center rounded-md border transition-colors"
                title="AI Shortcuts"
              >
                <i className="i-mgc-magic-2-cute-re size-3.5" />
              </button>
            </DropdownMenuTrigger>
            {shortcutsMenuContent}
          </DropdownMenu>
        )}

        {/* Context Blocks */}
        {blocks.map((block) => (
          <ContextBlock key={block.id} block={block} />
        ))}
      </div>
    )
  },
)
AIChatContextBar.displayName = "AIChatContextBar"

// Generic Picker Component
interface PickerItem {
  id: string
  title: string
}

interface PickerListProps<T extends PickerItem> {
  items: T[]
  placeholder: string
  onSelect: (id: string) => void
  renderItem?: (item: T, onSelect: (id: string) => void) => React.ReactNode
  noResultsText?: string
}

const PickerList = <T extends PickerItem>({
  items,
  placeholder,
  onSelect,
  renderItem,
  noResultsText = "No items found",
}: PickerListProps<T>) => {
  const [searchTerm, setSearchTerm] = useState("")

  const fuse = useMemo(() => {
    return new Fuse(items, {
      keys: ["title", "id"],
      threshold: 0.3,
    })
  }, [items])

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items
    const results = fuse.search(searchTerm)
    return results.map((result) => result.item)
  }, [items, fuse, searchTerm])

  const debouncedSetSearchTerm = useDebounceCallback(setSearchTerm, 300)

  const defaultRenderItem = (item: T, onSelect: (id: string) => void) => (
    <DropdownMenuItem key={item.id} onClick={() => onSelect(item.id)} className="text-xs">
      <span className="truncate">{item.title}</span>
    </DropdownMenuItem>
  )

  return (
    <div className="max-h-64 w-56">
      <SearchInput
        placeholder={placeholder}
        onKeyDown={stopPropagation}
        onKeyUp={stopPropagation}
        onChange={(e) => {
          debouncedSetSearchTerm(e.target.value)
        }}
      />
      <div className="max-h-48 overflow-y-auto pt-2">
        {filteredItems.length === 0 ? (
          <div className="text-text-tertiary p-2 text-xs">{noResultsText}</div>
        ) : (
          filteredItems.map((item) =>
            renderItem ? renderItem(item, onSelect) : defaultRenderItem(item, onSelect),
          )
        )}
      </div>
    </div>
  )
}

const CurrentFeedEntriesPickerList: FC<{ onSelect: (entryId: string) => void }> = ({
  onSelect,
}) => {
  const mainEntryId = useAIChatStore()((s) => s.blocks.find((b) => b.type === "mainEntry")?.value)
  const feedId = useEntry(mainEntryId, (e) => e?.feedId)

  const entryIds = useEntryIdsByFeedId(feedId!)

  return <BaseEntryPickerList items={entryIds || []} onSelect={onSelect} />
}

const RecentEntriesPickerList: FC<{ onSelect: (entryId: string) => void }> = ({ onSelect }) => {
  const view = useRouteParamsSelector((route) => route.view)
  const recentEntryIds = useEntryIdsByView(view, false)

  return <BaseEntryPickerList items={(recentEntryIds || []).slice(0, 20)} onSelect={onSelect} />
}

const BaseEntryPickerList: FC<{ items: string[]; onSelect: (entryId: string) => void }> = ({
  items,
  onSelect,
}) => {
  const entryStore = useEntryStore((state) => state.data)
  const entries = useMemo(() => {
    return items
      .map((entryId) => {
        const entry = entryStore[entryId]
        return entry ? { id: entryId, title: entry.title || "Untitled" } : null
      })
      .filter(Boolean) as PickerItem[]
  }, [items, entryStore])

  return (
    <PickerList
      items={entries}
      placeholder="Search entries..."
      onSelect={onSelect}
      noResultsText="No entries found"
    />
  )
}

const FeedPickerList: FC<{ onSelect: (feedId: string) => void }> = ({ onSelect }) => {
  const allSubscriptions = useAllFeedSubscription()

  // Get feeds with their details
  const feeds = useMemo(() => {
    return allSubscriptions
      .filter((subscription) => subscription.feedId)
      .map((subscription) => {
        const customTitle = subscription.title

        if (!subscription.feedId) return null
        const feed = getFeedById(subscription.feedId!)
        return {
          id: subscription.feedId!,
          title: customTitle || feed?.title || `Feed ${subscription.feedId}`,
        } as PickerItem
      })
      .filter(Boolean) as PickerItem[]
  }, [allSubscriptions])

  return (
    <PickerList
      items={feeds}
      placeholder="Search feeds..."
      onSelect={onSelect}
      noResultsText="No feeds found"
      renderItem={(feed, onSelect) => (
        <FeedPickerItem key={feed.id} feedId={feed.id} title={feed.title} onSelect={onSelect} />
      )}
    />
  )
}

const SearchInput: FC<React.ComponentProps<"input">> = (props) => {
  return (
    <div className="-mx-1 flex items-center border-b py-1">
      <i className="i-mgc-search-2-cute-re text-text-secondary ml-3 mr-1.5 size-4" />
      <input
        type="text"
        {...props}
        className="placeholder:text-text-tertiary w-full bg-transparent py-1 pl-0 pr-4 text-xs"
      />
    </div>
  )
}

// Individual Feed Picker Item that shows real feed title
const FeedPickerItem: FC<{
  feedId: string
  title: string
  onSelect: (feedId: string) => void
}> = ({ feedId, title, onSelect }) => {
  const feed = useFeedById(feedId, (feed) => ({ title: feed?.title }))
  const displayTitle = feed?.title || title || "Untitled Feed"

  return (
    <DropdownMenuItem onClick={() => onSelect(feedId)} className="text-xs">
      <span className="truncate">{displayTitle}</span>
    </DropdownMenuItem>
  )
}

const ContextBlock: FC<{ block: AIChatContextBlock }> = ({ block }) => {
  const blockActions = useChatBlockActions()

  const getBlockIcon = () => {
    switch (block.type) {
      case "mainEntry": {
        return "i-mgc-star-cute-fi"
      }
      case "referEntry": {
        return "i-mgc-paper-cute-fi"
      }
      case "referFeed": {
        return "i-mgc-rss-cute-fi"
      }
      case "selectedText": {
        return "i-mgc-quill-pen-cute-re"
      }

      default: {
        return "i-mgc-paper-cute-fi"
      }
    }
  }

  const getDisplayContent = () => {
    switch (block.type) {
      case "mainEntry":
      case "referEntry": {
        return <EntryTitle entryId={block.value} fallback={block.value} />
      }
      case "referFeed": {
        return <FeedTitle feedId={block.value} fallback={block.value} />
      }
      case "selectedText": {
        return `"${block.value}"`
      }
      default: {
        return block.value
      }
    }
  }

  const getBlockLabel = () => {
    switch (block.type) {
      case "mainEntry": {
        return "Current"
      }
      case "referEntry": {
        return "Ref"
      }
      case "referFeed": {
        return "Feed"
      }
      case "selectedText": {
        return "Text"
      }

      default: {
        return ""
      }
    }
  }

  const canRemove = block.type !== "mainEntry"

  return (
    <div className="bg-fill-tertiary border-border group relative flex h-7 max-w-[calc(50%-0.5rem)] flex-shrink-0 items-center gap-2 rounded-lg border px-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <div className="flex items-center gap-1">
          <i className={cn("size-3.5 flex-shrink-0", getBlockIcon())} />
          <span className="text-text-tertiary text-xs font-medium">{getBlockLabel()}</span>
        </div>

        <span className={cn("text-text min-w-0 flex-1 truncate text-xs")}>
          {getDisplayContent()}
        </span>
      </div>

      {canRemove && (
        <button
          type="button"
          onClick={() => blockActions.removeBlock(block.id)}
          className="text-text-tertiary hover:text-text-secondary flex-shrink-0 opacity-0 transition-all group-hover:opacity-100"
        >
          <i className="i-mgc-close-cute-re size-3" />
        </button>
      )}
    </div>
  )
}

const EntryTitle: FC<{ entryId?: string; fallback: string }> = ({ entryId, fallback }) => {
  const entryTitle = useEntry(entryId!, (e) => e?.title)

  if (!entryId || !entryTitle) {
    return <span className="text-text-tertiary">{fallback}</span>
  }

  return <span>{entryTitle}</span>
}

const FeedTitle: FC<{ feedId?: string; fallback: string }> = ({ feedId, fallback }) => {
  const feed = useFeedById(feedId, (feed) => ({ title: feed?.title }))
  if (!feedId || !feed) {
    return <span className="text-text-tertiary">{fallback}</span>
  }

  return <span>{feed.title}</span>
}
