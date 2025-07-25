import { useTypeScriptHappyCallback } from "@follow/hooks"
import { impactAsync, ImpactFeedbackStyle } from "expo-haptics"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { selectAtom } from "jotai/utils"
import * as React from "react"
import { Animated, StyleSheet, View } from "react-native"
import { RectButton, Swipeable } from "react-native-gesture-handler"

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
  const itemRef = React.useRef<Swipeable | null>(null)
  const endDragCallerRef = React.useRef<() => void>(() => {})
  const renderLeftActions = (progress: Animated.AnimatedInterpolation<number>) => {
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
          {leftActions?.map((action, index) => {
            const trans = progress.interpolate({
              inputRange: [0, 1],
              outputRange: [-rectButtonWidth * (leftActions?.length ?? 1), 0],
            })
            return (
              <Animated.View
                key={index}
                style={[
                  styles.animatedContainer,
                  {
                    transform: [
                      {
                        translateX: trans,
                      },
                    ],
                    width: rectButtonWidth,
                    left: index * rectButtonWidth,
                  },
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
          })}
        </Animated.View>
      </>
    )
  }
  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>) => {
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
                key={index}
                index={index}
                action={action}
                length={rightActions?.length ?? 1}
                progress={progress}
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
    <Swipeable
      ref={itemRef}
      enabled={!disabled}
      friction={1}
      onSwipeableWillOpen={() => {
        setAtom(id)
      }}
      leftThreshold={37}
      rightThreshold={37}
      enableTrackpadTwoFingerGesture
      useNativeAnimations
      onEnded={useTypeScriptHappyCallback(() => {
        if (swipeRightToCallAction && endDragCallerRef.current) {
          endDragCallerRef.current()
        }
      }, [swipeRightToCallAction, endDragCallerRef])}
      renderLeftActions={leftActions?.length ? renderLeftActions : undefined}
      renderRightActions={rightActions?.length ? renderRightActions : undefined}
      overshootLeft={leftActions?.length ? leftActions?.length >= 1 : undefined}
      overshootRight={rightActions?.length ? rightActions?.length >= 1 : undefined}
      overshootFriction={swipeRightToCallAction ? 1 : 10}
    >
      {children}
    </Swipeable>
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
const rightActionThreshold = -100
const RightRectButton = React.memo(
  ({
    index,
    action,
    length = 1,
    progress,
    swipeRightToCallAction,
    endDragCallerRef,
  }: {
    progress: Animated.AnimatedInterpolation<number>
    index: number
    action: Action
    length: number
    swipeRightToCallAction?: boolean
    endDragCallerRef: React.MutableRefObject<() => void>
  }) => {
    const trans = React.useMemo(
      () =>
        progress.interpolate({
          inputRange: [0, 1, 1.2],
          outputRange: [rectButtonWidth * length, 0, -40],
        }),
      [progress, length],
    )
    const parallaxX = React.useMemo(
      () =>
        progress.interpolate({
          inputRange: [0, 1, 1.2],
          outputRange: [0, 0, 10],
        }),
      [progress],
    )
    const hapticOnce = React.useRef(false)
    React.useEffect(() => {
      if (!swipeRightToCallAction) return
      const id = trans.addListener(({ value }) => {
        if (value <= rightActionThreshold) {
          if (hapticOnce.current) return
          hapticOnce.current = true
          impactAsync(ImpactFeedbackStyle.Light)
          endDragCallerRef.current = () => {
            action.onPress?.()
          }
        } else {
          hapticOnce.current = false
          endDragCallerRef.current = () => {}
        }
      })
      return () => {
        trans.removeListener(id)
      }
    }, [action, endDragCallerRef, swipeRightToCallAction, trans])
    return (
      <Animated.View
        key={index}
        style={[
          styles.animatedContainer,
          {
            transform: [
              {
                translateX: trans,
              },
            ],
            width: rectButtonWidth,
            left: index * rectButtonWidth,
          },
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
              {
                transform: [
                  {
                    translateX: parallaxX,
                  },
                ],
              },
            ]}
          >
            {action.label}
          </Animated.Text>
        </RectButton>
      </Animated.View>
    )
  },
)
