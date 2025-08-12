import { stopPropagation } from "@follow/utils"
import Fuse from "fuse.js"
import { useMemo, useState } from "react"
import { useDebounceCallback } from "usehooks-ts"

import { DropdownMenuItem } from "~/components/ui/dropdown-menu/dropdown-menu"

import { SearchInput } from "./SearchInput"

// Generic Picker Component
export interface PickerItem {
  id: string
  title: string
}

export interface PickerListProps<T extends PickerItem> {
  items: T[]
  placeholder: string
  onSelect: (id: string) => void
  renderItem?: (item: T, onSelect: (id: string) => void) => React.ReactNode
  noResultsText?: string
}

export const PickerList = <T extends PickerItem>({
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
