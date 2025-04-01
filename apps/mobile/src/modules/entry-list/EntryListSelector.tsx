import { FeedViewType } from "@follow/constants"
import type { FlashList } from "@shopify/flash-list"

import { NoLoginInfo } from "@/src/components/common/NoLoginInfo"
import { useRegisterNavigationScrollView } from "@/src/components/layouts/tabbar/hooks"
import type { EntryListContentPicture } from "@/src/modules/entry-list/EntryListContentPicture"
import { useWhoami } from "@/src/store/user/hooks"

import { EntryListContentArticle } from "./EntryListContentArticle"
import { EntryListContentSocial } from "./EntryListContentSocial"
import { EntryListContentVideo } from "./EntryListContentVideo"
import { EntryListContextViewContext } from "./EntryListContext"

export function EntryListSelector({
  entryIds,
  viewId,
  active = true,
}: {
  entryIds: string[]
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
      // ContentComponent = EntryListContentPicture
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
