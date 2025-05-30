import { useMemo } from "react"
import { TouchableOpacity } from "react-native"
import * as DropdownMenu from "zeego/dropdown-menu"

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

  const actions = useMemo(() => {
    const alphabetOrderActions = [
      {
        title: "Ascending",
        selected: sortMethod === "alphabet" && sortOrder === "asc",
        onSelect: () => {
          setFeedListSortMethod("alphabet")
          setFeedListSortOrder("asc")
        },
      },
      {
        title: "Descending",
        selected: sortMethod === "alphabet" && sortOrder === "desc",
        onSelect: () => {
          setFeedListSortMethod("alphabet")
          setFeedListSortOrder("desc")
        },
      },
    ]

    const countOrderActions = [
      {
        title: "Ascending",
        selected: sortMethod === "count" && sortOrder === "asc",
        onSelect: () => {
          setFeedListSortMethod("count")
          setFeedListSortOrder("asc")
        },
      },
      {
        title: "Descending",
        selected: sortMethod === "count" && sortOrder === "desc",
        onSelect: () => {
          setFeedListSortMethod("count")
          setFeedListSortOrder("desc")
        },
      },
    ]

    return [
      {
        title: "Sort by Alphabet",
        actions: alphabetOrderActions,
        selected: sortMethod === "alphabet",
      },
      {
        title: "Sort by Unread Count",
        actions: countOrderActions,
        selected: sortMethod === "count",
      },
    ]
  }, [sortMethod, sortOrder])

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <TouchableOpacity className="size-5 rounded-full">
          <ListExpansionCuteReIcon width={20} height={20} />
        </TouchableOpacity>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content>
        {actions.map((action) => {
          const subActions = action.actions
          return (
            <DropdownMenu.Sub key={`Sub/${action.title}`}>
              <DropdownMenu.SubTrigger key={`SubTrigger/${action.title}`}>
                <DropdownMenu.ItemTitle>{action.title}</DropdownMenu.ItemTitle>
              </DropdownMenu.SubTrigger>

              <DropdownMenu.SubContent>
                {subActions.map((subAction) => {
                  const isSelected = subAction.selected
                  return (
                    <DropdownMenu.CheckboxItem
                      key={`SubContent/${action.title}/${subAction.title}`}
                      value={isSelected}
                      onSelect={subAction.onSelect}
                    >
                      <DropdownMenu.ItemTitle>{subAction.title}</DropdownMenu.ItemTitle>
                    </DropdownMenu.CheckboxItem>
                  )
                })}
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>
          )
        })}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}
