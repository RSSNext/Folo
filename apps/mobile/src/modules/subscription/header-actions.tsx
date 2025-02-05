import { TouchableOpacity } from "react-native"
import type { ContextMenuAction } from "react-native-context-menu-view"

import { DropdownMenu } from "@/src/components/ui/dropdown/DropdownMenu"
import { ListExpansionCuteReIcon } from "@/src/icons/list_expansion_cute_re"

import {
  setFeedListSortMethod,
  setFeedListSortOrder,
  useFeedListSortMethod,
  useFeedListSortOrder,
} from "./atoms"

export const SortActionButton = () => {
  const sortMethod = useFeedListSortMethod()
  const sortOrder = useFeedListSortOrder()

  const alphabetOrderActions: ContextMenuAction[] = [
    { title: "Ascending", selected: sortMethod === "alphabet" && sortOrder === "asc" },
    { title: "Descending", selected: sortMethod === "alphabet" && sortOrder === "desc" },
  ]

  const countOrderActions: ContextMenuAction[] = [
    { title: "Ascending", selected: sortMethod === "count" && sortOrder === "asc" },
    { title: "Descending", selected: sortMethod === "count" && sortOrder === "desc" },
  ]

  const actions: ContextMenuAction[] = [
    {
      title: "Sort by Alphabet",
      actions: alphabetOrderActions,
      selected: sortMethod === "alphabet",
    },
    { title: "Sort by Unread Count", actions: countOrderActions, selected: sortMethod === "count" },
  ]

  return (
    <TouchableOpacity className="size-5 rounded-full">
      <DropdownMenu
        options={actions}
        currentValue={sortMethod}
        handlePress={(e) => {
          const [firstArgs, secondary] = e.nativeEvent.indexPath

          switch (firstArgs) {
            case 0: {
              setFeedListSortMethod("alphabet")
              break
            }
            case 1: {
              setFeedListSortMethod("count")
              break
            }
          }

          switch (secondary) {
            case 0: {
              setFeedListSortOrder("asc")
              break
            }
            case 1: {
              setFeedListSortOrder("desc")
              break
            }
          }
        }}
      >
        <ListExpansionCuteReIcon width={20} height={20} />
      </DropdownMenu>
    </TouchableOpacity>
  )
}
