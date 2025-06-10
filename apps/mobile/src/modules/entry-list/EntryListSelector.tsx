import { FeedViewType } from "@follow/constants"
import { useWhoami } from "@follow/store/user/hooks"
import type { FlashList } from "@shopify/flash-list"
import type { RefObject } from "react"
import { useEffect } from "react"

import { useGeneralSettingKey } from "@/src/atoms/settings/general"
import { withErrorBoundary } from "@/src/components/common/ErrorBoundary"
import { NoLoginInfo } from "@/src/components/common/NoLoginInfo"
import { ListErrorView } from "@/src/components/errors/ListErrorView"
import { useRegisterNavigationScrollView } from "@/src/components/layouts/tabbar/hooks"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { EntryListContentPicture } from "@/src/modules/entry-list/EntryListContentPicture"
import { EntryDetailScreen } from "@/src/screens/(stack)/entries/[entryId]/EntryDetailScreen"

import { useEntries } from "../screen/atoms"
import { EntryListContentArticle } from "./EntryListContentArticle"
import { EntryListContentSocial } from "./EntryListContentSocial"
import { EntryListContentVideo } from "./EntryListContentVideo"

const NoLoginGuard = ({ children }: { children: React.ReactNode }) => {
  const whoami = useWhoami()
  return whoami ? children : <NoLoginInfo target="timeline" />
}

type EntryListSelectorProps = {
  viewId: FeedViewType
  active?: boolean
}

function EntryListSelectorImpl({ viewId, active = true }: EntryListSelectorProps) {
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

  const { isRefetching, entriesIds } = useEntries()
  useEffect(() => {
    if (isRefetching) {
      ref?.current?.scrollToOffset({
        offset: 0,
      })
    }
  }, [isRefetching, ref])

  useAutoScrollToEntryAfterPullUpToNext(ref, entriesIds || [])

  return <ContentComponent ref={ref} entryIds={entriesIds} active={active} view={viewId} />
}

export const EntryListSelector = withErrorBoundary(({ viewId, active }: EntryListSelectorProps) => {
  return (
    <NoLoginGuard>
      <EntryListSelectorImpl viewId={viewId} active={active} />
    </NoLoginGuard>
  )
}, ListErrorView)

const useAutoScrollToEntryAfterPullUpToNext = (
  ref: RefObject<FlashList<any> | null>,
  entryIds: string[],
) => {
  const navigation = useNavigation()
  useEffect(() => {
    return navigation.on("screenChange", (payload) => {
      if (!payload.route) return
      if (payload.type !== "appear") return
      if (payload.route.Component !== EntryDetailScreen) return
      if (payload.route.screenOptions?.stackAnimation !== "fade_from_bottom") return
      const nextEntryId =
        payload.route.props &&
        typeof payload.route.props === "object" &&
        "entryId" in payload.route.props &&
        typeof payload.route.props.entryId === "string"
          ? payload.route.props.entryId
          : undefined
      const idx = nextEntryId ? (entryIds?.indexOf(nextEntryId || "") ?? -1) : -1
      if (idx === -1) return
      ref?.current?.scrollToIndex({
        index: idx,
        animated: false,
        viewOffset: 70,
      })
    })
  }, [entryIds, navigation, ref])
}
