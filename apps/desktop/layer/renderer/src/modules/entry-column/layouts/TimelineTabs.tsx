import { Tabs, TabsList, TabsTrigger } from "@follow/components/ui/tabs/index.jsx"
import {
  useCategories,
  useFeedSubscription,
  useListSubscription,
} from "@follow/store/subscription/hooks"

import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { useRouteParams } from "~/hooks/biz/useRouteParams"
import { InboxItem, ListItem } from "~/modules/subscription-column/FeedItem"

export const TimelineTabs = () => {
  const routerParams = useRouteParams()
  const { view, listId, inboxId, folderName } = routerParams

  const listsData = useListSubscription(view)
  const inboxData = useFeedSubscription(view)
  const categoriesData = useCategories(view)
  const hasData = listsData.length > 0 || inboxData.length > 0

  const timeline = listId || inboxId || folderName || ""

  const navigate = useNavigateEntry()
  if (!hasData) return null

  return (
    <Tabs
      variant={"rounded"}
      className="scrollbar-none -ml-6 -mr-4 mt-2 flex overflow-x-auto overflow-y-hidden pl-3"
      value={timeline}
      onValueChange={(val) => {
        if (!val) {
          navigate({
            feedId: null,
            entryId: null,
            view,
          })
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
