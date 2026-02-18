import { useAtom } from "jotai"
import type { FC } from "react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Animated } from "react-native"

import { TabBar } from "@/src/components/ui/tabview/TabBar"

import type { SearchType } from "./constants"
import { SearchTabs } from "./constants"
import { useSearchPageContext } from "./ctx"

export const SearchTabBar: FC<{
  animatedX: Animated.Value
}> = ({ animatedX }) => {
  const { t } = useTranslation("common")
  const { searchTypeAtom } = useSearchPageContext()
  const [searchType, setSearchType] = useAtom(searchTypeAtom)
  const tabs = useMemo(
    () =>
      SearchTabs.map((tab) => ({
        ...tab,
        name: t(tab.name),
      })),
    [t],
  )

  return (
    <TabBar
      tabbarClassName="border-b border-b-opaque-separator/40"
      tabScrollContainerAnimatedX={animatedX}
      tabs={tabs}
      currentTab={tabs.findIndex((tab) => tab.value === searchType)}
      onTabItemPress={(index) => {
        setSearchType(tabs[index]!.value as SearchType)
      }}
    />
  )
}
