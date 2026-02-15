import { impactAsync, ImpactFeedbackStyle } from "expo-haptics"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { selectAtom } from "jotai/utils"
import * as React from "react"
import { StyleSheet, View } from "react-native"
import { RectButton } from "react-native-gesture-handler"
import type { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable"
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable"
import type { SharedValue } from "react-native-reanimated"
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
} from "react-native-reanimated"

import { Text } from "@/src/components/ui/typography/Text"

interface Action {
  label: string
  icon?: React.ReactNode
  backgroundColor?: string
  onPress?: () => void
  color?: string
}
interface SwipeableItemProps {
  children: React.ReactNode
  leftActions?: Action[]
  rightActions?: Action[]
  disabled?: boolean
  swipeRightToCallAction?: boolean
}
const getActionKey = (side: "left" | "right", action: Action) => {
  return `${side}-${action.label}-${action.backgroundColor ?? ""}-${action.color ?? ""}`
}
const styles = StyleSheet.create({
  absoluteFill: {
    ...StyleSheet.absoluteFillObject,
  },
  actionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  animatedContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
  },
  actionsWrapper: {
    flexDirection: "row",
  },
  actionText: {
    color: "#fff",
  },
})
const rectButtonWidth = 74
export const SwipeableItem: React.FC<SwipeableItemProps> = ({
  children,
  leftActions,
  rightActions,
  disabled,
  swipeRightToCallAction,
}) => {
  const itemRef = React.useRef<SwipeableMethods | null>(null)
  const endDragCallerRef = React.useRef<() => void>(() => {})
  const renderLeftActions = (progress: SharedValue<number>) => {
    const width = leftActions?.length ? leftActions.length * rectButtonWidth : rectButtonWidth
    return (
      <>
        <View
          style={[
            styles.absoluteFill,
            {
              backgroundColor: leftActions?.[0]?.backgroundColor ?? "#fff",
            },
          ]}
        />
        <Animated.View
          style={[
            styles.actionsWrapper,
            {
              width,
            },
          ]}
        >
          {leftActions?.map((action, index) => (
            <LeftActionItem
              key={getActionKey("left", action)}
              index={index}
              action={action}
              progress={progress}
              length={leftActions?.length ?? 1}
            />
          ))}
        </Animated.View>
      </>
    )
  }
  const renderRightActions = (progress: SharedValue<number>, translation: SharedValue<number>) => {
    const width = rightActions?.length ? rightActions.length * rectButtonWidth : rectButtonWidth
    return (
      <>
        <View
          style={[
            styles.absoluteFill,
            {
              backgroundColor: rightActions?.at(-1)?.backgroundColor ?? "#fff",
            },
          ]}
        />
        <Animated.View
          style={[
            styles.actionsWrapper,
            {
              width,
            },
          ]}
        >
          {rightActions?.map((action, index) => {
            return (
              <RightRectButton
                endDragCallerRef={endDragCallerRef}
                key={getActionKey("right", action)}
                index={index}
                action={action}
                length={rightActions?.length ?? 1}
                progress={progress}
                translation={translation}
                swipeRightToCallAction={
                  swipeRightToCallAction && index === rightActions?.length - 1
                }
              />
            )
          })}
        </Animated.View>
      </>
    )
  }
  const id = React.useId()
  const { swipeableOpenedId } = React.use(SwipeableGroupContext)
  const setAtom = useSetAtom(swipeableOpenedId)
  const isOpened = useAtomValue(
    React.useMemo(
      () => selectAtom(swipeableOpenedId, (value) => value === id),
      [id, swipeableOpenedId],
    ),
  )
  React.useEffect(() => {
    if (!isOpened) {
      itemRef.current?.close()
    }
  }, [isOpened])
  return (
    <ReanimatedSwipeable
      ref={itemRef}
      enabled={!disabled}
      friction={1}
      onSwipeableWillOpen={() => {
        setAtom(id)
        if (swipeRightToCallAction && endDragCallerRef.current) {
          endDragCallerRef.current()
          endDragCallerRef.current = () => {}
        }
      }}
      leftThreshold={37}
      rightThreshold={37}
      enableTrackpadTwoFingerGesture
      renderLeftActions={leftActions?.length ? renderLeftActions : undefined}
      renderRightActions={rightActions?.length ? renderRightActions : undefined}
      overshootLeft={leftActions?.length ? leftActions?.length >= 1 : undefined}
      overshootRight={rightActions?.length ? rightActions?.length >= 1 : undefined}
      overshootFriction={swipeRightToCallAction ? 1 : 10}
    >
      {children}
    </ReanimatedSwipeable>
  )
}
const SwipeableGroupContext = React.createContext({
  swipeableOpenedId: atom(""),
})
export const SwipeableGroupProvider = ({ children }: { children: React.ReactNode }) => {
  const ctx = React.useMemo(
    () => ({
      swipeableOpenedId: atom(""),
    }),
    [],
  )
  return <SwipeableGroupContext value={ctx}>{children}</SwipeableGroupContext>
}

const LeftActionItem = React.memo(
  ({
    index,
    action,
    progress,
    length = 1,
  }: {
    index: number
    action: Action
    progress: SharedValue<number>
    length: number
  }) => {
    const animStyle = useAnimatedStyle(() => ({
      transform: [
        {
          translateX: interpolate(progress.value, [0, 1], [-rectButtonWidth * length, 0]),
        },
      ],
    }))
    return (
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            width: rectButtonWidth,
            left: index * rectButtonWidth,
          },
          animStyle,
        ]}
      >
        <RectButton
          style={[
            styles.actionContainer,
            {
              backgroundColor: action.backgroundColor ?? "#fff",
            },
          ]}
          onPress={action.onPress}
        >
          {action.icon}
          <Text
            style={[
              styles.actionText,
              {
                color: action.color ?? "#fff",
              },
            ]}
          >
            {action.label}
          </Text>
        </RectButton>
      </Animated.View>
    )
  },
)

const rightActionThreshold = -100
const RightRectButton = React.memo(
  ({
    index,
    action,
    length = 1,
    progress,
    translation,
    swipeRightToCallAction,
    endDragCallerRef,
  }: {
    progress: SharedValue<number>
    translation: SharedValue<number>
    index: number
    action: Action
    length: number
    swipeRightToCallAction?: boolean
    endDragCallerRef: React.MutableRefObject<() => void>
  }) => {
    const hapticOnce = React.useRef(false)

    const setEndDragCaller = React.useCallback(
      (shouldCall: boolean) => {
        if (shouldCall) {
          if (!hapticOnce.current) {
            hapticOnce.current = true
            impactAsync(ImpactFeedbackStyle.Light)
            endDragCallerRef.current = () => {
              action.onPress?.()
            }
          }
        } else {
          hapticOnce.current = false
          endDragCallerRef.current = () => {}
        }
      },
      [action, endDragCallerRef],
    )

    useAnimatedReaction(
      () => translation.value,
      (value) => {
        if (!swipeRightToCallAction) return
        runOnJS(setEndDragCaller)(value <= rightActionThreshold)
      },
      [swipeRightToCallAction, setEndDragCaller],
    )

    const animStyle = useAnimatedStyle(() => ({
      transform: [
        {
          translateX: interpolate(progress.value, [0, 1, 1.2], [rectButtonWidth * length, 0, -40]),
        },
      ],
    }))

    const textAnimStyle = useAnimatedStyle(() => ({
      transform: [
        {
          translateX: interpolate(progress.value, [0, 1, 1.2], [0, 0, 10]),
        },
      ],
    }))

    return (
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            width: rectButtonWidth,
            left: index * rectButtonWidth,
          },
          animStyle,
        ]}
      >
        <RectButton
          style={[
            styles.actionContainer,
            {
              backgroundColor: action.backgroundColor ?? "#fff",
            },
          ]}
          onPress={action.onPress}
        >
          {action.icon}
          <Animated.Text
            style={[
              styles.actionText,
              {
                color: action.color ?? "#fff",
              },
              textAnimStyle,
            ]}
          >
            {action.label}
          </Animated.Text>
        </RectButton>
      </Animated.View>
    )
  },
)
