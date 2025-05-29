import { Tabs, TabsList, TabsTrigger } from "@follow/components/ui/tabs/index.jsx"
import { useSetAtom } from "jotai"
import { useCallback } from "react"

import { desktopTimelineSearchQueryAtom } from "../../../atoms/search" // Adjusted path
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { useRouteParams } from "~/hooks/biz/useRouteParams"
import { InboxItem, ListItem } from "~/modules/subscription-column/FeedItem"
import { useSubscriptionStore } from "~/store/subscription"

export const TimelineTabs = () => {
  const routerParams = useRouteParams()
  const { view, listId, inboxId, folderName } = routerParams

  const listsData = useSubscriptionStore(
    useCallback((state) => Array.from(state.listIds).map((id) => state.data[id]), []),
  )
  const inboxData = useSubscriptionStore(
    useCallback((state) => Array.from(state.inboxIds).map((id) => state.data[id]), []),
  )
  const categoriesData = useSubscriptionStore(
    useCallback(
      (state) => {
        const categoryNames = new Set<string>()
        for (const subId of state.feedIdByView[view]) {
          const sub = state.data[subId]!
          if (sub.category) {
            categoryNames.add(sub.category)
          }
        }
        return Array.from(categoryNames)
      },
      [view],
    ),
  )
  const hasData = listsData.length > 0 || inboxData.length > 0

  const timeline = listId || inboxId || folderName || ""

  const navigate = useNavigateEntry()
  const setDesktopSearchQuery = useSetAtom(desktopTimelineSearchQueryAtom)

  if (!hasData) return null

  return (
    <Tabs
      variant={"rounded"}
      className="scrollbar-none -ml-6 -mr-4 mt-2 flex overflow-x-auto overflow-y-hidden pl-3"
      value={timeline}
      onValueChange={(val) => {
        setDesktopSearchQuery("") // Clear search on tab change
        if (!val) {
          navigate({
            feedId: null,
            entryId: null,
            view,
          })
        }
        // For specific list/inbox navigations that also go through here if `val` is their ID
        // This might need to be more specific if `val` can be something other than listId/inboxId
        else if (listsData.find(l => l.listId === val) || inboxData.find(i => i.inboxId === val)) {
           // The navigation to list/inbox is handled by the Tabs value change itself,
           // if the `TabsTrigger` for lists/inboxes have their `value` set to their respective IDs
           // and the main `Tabs` component's `onValueChange` implicitly handles navigation
           // by changing the `timeline` variable which might be a dependency elsewhere.
           // If explicit navigation is needed here:
           // navigate({ listId: val, view }); or navigate({ inboxId: val, view});
        }
      }}
    >
      <TabsList className="justify-start border-b-0 [&_span]:text-xs">
        <TabsTrigger className="p-0" value="">
          <span>Yours</span>
        </TabsTrigger>
        {listsData
          .filter((s) => !!s)
          .map((s) => (
            <TabsTrigger className="p-0" key={s.listId} value={s.listId!}>
              <ListItem
                listId={s.listId!}
                view={view}
                iconSize={16}
                className="h-5 !bg-transparent p-0"
              />
            </TabsTrigger>
          ))}
        {categoriesData.map((s) => (
          <TabsTrigger
            key={s}
            value={s}
            onClick={() => {
              setDesktopSearchQuery("") // Clear search on category click
              navigate({
                folderName: s,
              })
            }}
          >
            <span className="flex h-5 items-center gap-1">
              <i className="i-mgc-folder-open-cute-re" />
              {s}
            </span>
          </TabsTrigger>
        ))}
        {inboxData
          .filter((s) => !!s)
          .map((s) => (
            <TabsTrigger key={s.inboxId} value={s.inboxId!}>
              <InboxItem
                inboxId={s.inboxId!}
                view={view}
                iconSize={16}
                className="h-5 !bg-transparent p-0"
              />
            </TabsTrigger>
          ))}
      </TabsList>
    </Tabs>
  )
}
