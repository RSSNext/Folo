import { cn } from "@follow/utils/utils"
import { useWindowDimensions, View } from "react-native"

import { useSearchBarHeight } from "../ctx"

export const BaseSearchPageRootView = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => {
  const windowWidth = useWindowDimensions().width

  const searchBarHeight = useSearchBarHeight()
  const offsetTop = searchBarHeight
  return (
    <View className={cn("flex-1", className)} style={{ paddingTop: offsetTop, width: windowWidth }}>
      {children}
    </View>
  )
}

const itemSeparator = (
  <View className="h-px bg-opaque-separator/70" style={{ transform: [{ scaleY: 0.5 }] }} />
)
export const ItemSeparator = () => itemSeparator
