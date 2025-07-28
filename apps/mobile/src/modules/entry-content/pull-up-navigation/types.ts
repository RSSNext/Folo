import type { FC, PropsWithChildren } from "react"
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native"
import type { ComposedGesture, GestureType } from "react-native-gesture-handler"
import type { SharedValue } from "react-native-reanimated"
import type { ReanimatedScrollEvent } from "react-native-reanimated/lib/typescript/hook/commonTypes"

interface EntryPullUpToNextProps {
  active: boolean
  hide?: boolean
  translateY: SharedValue<number>
}

export interface UsePullUpToNextProps {
  enabled?: boolean
  onRefresh?: (() => void) | undefined
  progressViewOffset?: number
}

interface GestureWrapperProps {
  enabled?: boolean
  gesture?: ComposedGesture | GestureType
}

export interface UsePullUpToNextReturn {
  pullUpViewProps: EntryPullUpToNextProps
  scrollViewEventHandlers: {
    onScroll?: (e: ReanimatedScrollEvent) => void
    onScrollBeginDrag?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void
    onScrollEndDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  }
  EntryPullUpToNext: FC<EntryPullUpToNextProps>
  gestureWrapperProps: GestureWrapperProps
  GestureWrapper: FC<PropsWithChildren<GestureWrapperProps>>
}
