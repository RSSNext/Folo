import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Pressable } from "react-native"
import * as DropdownMenu from "zeego/dropdown-menu"

import { ListExpansionCuteReIcon } from "@/src/icons/list_expansion_cute_re"

import {
  setFeedListSortMethod,
  setFeedListSortOrder,
  useFeedListSortMethod,
  useFeedListSortOrder,
} from "./atoms"

export const SortActionButton = () => {
  const { t } = useTranslation()
  const sortMethod = useFeedListSortMethod()
  const sortOrder = useFeedListSortOrder()

  const actions = useMemo(() => {
    const alphabetOrderActions = [
      {
        title: t("operation.sort_subscriptions.ascending"),
        selected: sortMethod === "alphabet" && sortOrder === "asc",
        onSelect: () => {
          setFeedListSortMethod("alphabet")
          setFeedListSortOrder("asc")
        },
      },
      {
        title: t("operation.sort_subscriptions.descending"),
        selected: sortMethod === "alphabet" && sortOrder === "desc",
        onSelect: () => {
          setFeedListSortMethod("alphabet")
          setFeedListSortOrder("desc")
        },
      },
    ]

    const countOrderActions = [
      {
        title: t("operation.sort_subscriptions.ascending"),
        selected: sortMethod === "count" && sortOrder === "asc",
        onSelect: () => {
          setFeedListSortMethod("count")
          setFeedListSortOrder("asc")
        },
      },
      {
        title: t("operation.sort_subscriptions.descending"),
        selected: sortMethod === "count" && sortOrder === "desc",
        onSelect: () => {
          setFeedListSortMethod("count")
          setFeedListSortOrder("desc")
        },
      },
    ]

    return [
      {
        title: t("operation.sort_subscriptions.by_alphabet"),
        actions: alphabetOrderActions,
        selected: sortMethod === "alphabet",
      },
      {
        title: t("operation.sort_subscriptions.by_unread_count"),
        actions: countOrderActions,
        selected: sortMethod === "count",
      },
    ]
  }, [sortMethod, sortOrder, t])

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Pressable className="size-5 rounded-full">
          <ListExpansionCuteReIcon width={20} height={20} />
        </Pressable>
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
