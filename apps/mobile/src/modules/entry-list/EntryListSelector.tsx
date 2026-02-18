import { FeedViewType } from "@follow/constants"
import { useWhoami } from "@follow/store/user/hooks"
import type { FlashListRef } from "@shopify/flash-list"
import type { RefObject } from "react"
import { useEffect, useRef } from "react"

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
  entryIds: string[] | null
  viewId: FeedViewType
  active?: boolean
}

function EntryListSelectorImpl({ entryIds, viewId, active = true }: EntryListSelectorProps) {
  const ref = useRegisterNavigationScrollView<FlashListRef<any>>(active)

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
      animated: false,
    })
  }, [unreadOnly, ref])

  const { isReady } = useEntries({ viewId, active })
  const hasResetAfterReadyRef = useRef(false)
  useEffect(() => {
    if (!active) return
    if (!isReady) {
      hasResetAfterReadyRef.current = false
      return
    }
    if (!entryIds?.length) return
    if (hasResetAfterReadyRef.current) return

    const frameId = requestAnimationFrame(() => {
      ref?.current?.scrollToOffset({
        offset: 0,
        animated: false,
      })
    })
    hasResetAfterReadyRef.current = true

    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [active, entryIds, isReady, ref, viewId])

  useEffect(() => {
    if (!active) return

    const frameId = requestAnimationFrame(() => {
      ref?.current?.scrollToOffset({
        offset: 0,
        animated: false,
      })
    })

    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [active, ref, viewId])

  useAutoScrollToEntryAfterPullUpToNext(ref, entryIds || [])

  return <ContentComponent ref={ref} entryIds={entryIds} active={active} view={viewId} />
}

export const EntryListSelector = withErrorBoundary(
  ({ entryIds, viewId, active }: EntryListSelectorProps) => {
    return (
      <NoLoginGuard>
        <EntryListSelectorImpl entryIds={entryIds} viewId={viewId} active={active} />
      </NoLoginGuard>
    )
  },
  ListErrorView,
)

const useAutoScrollToEntryAfterPullUpToNext = (
  ref: RefObject<FlashListRef<any> | null>,
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
