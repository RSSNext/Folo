import { createContext, use } from "react"
import type { ScrollView } from "react-native"

export const AttachNavigationScrollViewContext = createContext<React.RefObject<ScrollView> | null>(
  null,
)

export const SetAttachNavigationScrollViewContext = createContext<
  React.Dispatch<React.SetStateAction<React.RefObject<ScrollView> | null>>
>(null!)

export const useAttachNavigationScrollView = () => {
  return use(AttachNavigationScrollViewContext)
}
