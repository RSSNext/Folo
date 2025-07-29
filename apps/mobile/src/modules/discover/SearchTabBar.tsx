import { useAtom } from "jotai"
import type { FC } from "react"
import type { Animated } from "react-native"

import { TabBar } from "@/src/components/ui/tabview/TabBar"

import type { SearchType } from "./constants"
import { SearchTabs } from "./constants"
import { useSearchPageContext } from "./ctx"

export const SearchTabBar: FC<{
  animatedX: Animated.Value
}> = ({ animatedX }) => {
  const { searchTypeAtom } = useSearchPageContext()
  const [searchType, setSearchType] = useAtom(searchTypeAtom)

  return (
    <TabBar
      tabbarClassName="border-b border-b-opaque-separator/40"
      tabScrollContainerAnimatedX={animatedX}
      tabs={SearchTabs}
      currentTab={SearchTabs.findIndex((tab) => tab.value === searchType)}
      onTabItemPress={(index) => {
        setSearchType(SearchTabs[index]!.value as SearchType)
      }}
    />
  )
}
