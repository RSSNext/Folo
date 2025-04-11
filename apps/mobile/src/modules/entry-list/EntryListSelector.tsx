import { FeedViewType } from "@follow/constants"
import type { FlashList } from "@shopify/flash-list"
import { useEffect } from "react"

import { useGeneralSettingKey } from "@/src/atoms/settings/general"
import { withErrorBoundary } from "@/src/components/common/ErrorBoundary"
import { NoLoginInfo } from "@/src/components/common/NoLoginInfo"
import { ListErrorView } from "@/src/components/errors/ListErrorView"
import { useRegisterNavigationScrollView } from "@/src/components/layouts/tabbar/hooks"
import { EntryListContentPicture } from "@/src/modules/entry-list/EntryListContentPicture"
import { useWhoami } from "@/src/store/user/hooks"

import { useFetchEntriesControls } from "../screen/atoms"
import { EntryListContentArticle } from "./EntryListContentArticle"
import { EntryListContentSocial } from "./EntryListContentSocial"
import { EntryListContentVideo } from "./EntryListContentVideo"
import { EntryListContextViewContext } from "./EntryListContext"

function EntryListSelectorImpl({
  entryIds,
  viewId,
  active = true,
}: {
  entryIds: string[] | null
  viewId: FeedViewType
  active?: boolean
}) {
  const whoami = useWhoami()
  const ref = useRegisterNavigationScrollView<FlashList<any>>(active)

  let ContentComponent:
    | typeof EntryListContentSocial
    | typeof EntryListContentPicture
    | typeof EntryListContentVideo
    | typeof EntryListContentArticle = EntryListContentArticle
  switch (viewId) {
    case FeedViewType.SocialMedia: {
      ContentComponent = EntryListContentSocial
      break
    }
    case FeedViewType.Pictures: {
      ContentComponent = EntryListContentPicture
      break
    }
    case FeedViewType.Videos: {
      ContentComponent = EntryListContentVideo
      break
    }
    case FeedViewType.Articles: {
      ContentComponent = EntryListContentArticle
      break
    }
  }

  const unreadOnly = useGeneralSettingKey("unreadOnly")
  useEffect(() => {
    ref?.current?.scrollToOffset({
      offset: 0,
    })
  }, [unreadOnly, ref])

  const { isRefetching } = useFetchEntriesControls()
  useEffect(() => {
    if (isRefetching) {
      ref?.current?.scrollToOffset({
        offset: 0,
      })
    }
  }, [isRefetching, ref])

  return (
    <EntryListContextViewContext.Provider value={viewId}>
      {whoami ? (
        <ContentComponent ref={ref} entryIds={entryIds} active={active} />
      ) : (
        <NoLoginInfo target="timeline" />
      )}
    </EntryListContextViewContext.Provider>
  )
}

export const EntryListSelector = withErrorBoundary(EntryListSelectorImpl, ListErrorView)
