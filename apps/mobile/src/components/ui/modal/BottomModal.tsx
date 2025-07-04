import { cn } from "@follow/utils/utils"
import type { ReactNode } from "react"
import { useCallback, useEffect, useState } from "react"
import { KeyboardAvoidingView, Modal, Pressable, View } from "react-native"
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

export interface BottomModalProps {
  // ref?: Ref<{ close: () => void }>
  /**
   * Whether the modal is visible
   */
  visible: boolean

  /**
   * Function to call when the modal should be closed (backdrop press or programmatically)
   */
  onClose?: () => void

  /**
   * Content to render inside the modal
   */
  children: ReactNode

  /**
   * Modal container class name
   */
  className?: string

  /**
   * Duration for the open animation in milliseconds
   * @default 300
   */
  openDuration?: number

  /**
   * Duration for the close animation in milliseconds
   * @default 250
   */
  closeDuration?: number

  /**
   * Allow closing the modal by tapping on the backdrop
   * @default true
   */
  closeOnBackdropPress?: boolean

  /**
   * Backdrop opacity when fully visible
   * @default 0.5
   */
  backdropOpacity?: number
}

/**
 * An animated modal that slides up from the bottom of the screen with a fading backdrop.
 * Great for bottom sheets, pickers, and other content that should appear from the bottom.
 */
export function BottomModal({
  visible,
  onClose,
  children,
  className = "max-h-[40%]",
  openDuration = 300,
  closeDuration = 250,
  closeOnBackdropPress = true,
  backdropOpacity = 0.3,
}: BottomModalProps) {
  const [internalVisible, setInternalVisible] = useState(false)
  const backdropAnim = useSharedValue(0)
  const contentTranslateY = useSharedValue(300)

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropAnim.value,
  }))

  const modalContentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentTranslateY.value }],
  }))

  // useImperativeHandle(ref, () => ({
  //   close: () => {
  //     if (internalVisible) {
  //       hideModal()
  //     }
  //   },
  //   open: () => {
  //     if (!internalVisible) {
  //       showModal()
  //     }
  //   },
  // }))

  const showModal = useCallback(() => {
    setInternalVisible(true)
    backdropAnim.value = withTiming(backdropOpacity, {
      duration: openDuration,
      easing: Easing.out(Easing.cubic),
    })

    contentTranslateY.value = withTiming(0, {
      duration: openDuration,
      easing: Easing.out(Easing.cubic),
    })
  }, [backdropAnim, contentTranslateY, backdropOpacity, openDuration])

  const hideModal = useCallback(() => {
    backdropAnim.value = withTiming(0, {
      duration: closeDuration,
      easing: Easing.in(Easing.cubic),
    })

    contentTranslateY.value = withTiming(
      300,
      {
        duration: closeDuration,
        easing: Easing.in(Easing.cubic),
      },
      () => {
        runOnJS(setInternalVisible)(false)
        if (onClose) {
          runOnJS(onClose)()
        }
      },
    )
  }, [backdropAnim, contentTranslateY, closeDuration, onClose])

  const handleBackdropPress = useCallback(() => {
    if (closeOnBackdropPress) {
      hideModal()
    }
  }, [closeOnBackdropPress, hideModal])

  // Start animations when visibility changes
  useEffect(() => {
    if (visible === internalVisible) {
      return // No change, do nothing
    }
    if (visible) {
      showModal()
    } else {
      hideModal()
    }
  }, [visible, showModal, hideModal, internalVisible])

  if (!internalVisible) {
    return null
  }

  return (
    // Wrap in a View to avoid rendering issues with Modal on Android
    <View>
      <Modal
        visible={internalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={hideModal}
        statusBarTranslucent
        navigationBarTranslucent
      >
        <KeyboardAvoidingView className="flex-1" behavior="padding">
          <Animated.View className="absolute inset-0 bg-black" style={backdropStyle}>
            <Pressable
              className="flex-1"
              onPress={handleBackdropPress}
              android_ripple={{ color: "white" }}
            />
          </Animated.View>

          <Animated.View
            className={cn(
              "bg-system-background mt-auto flex-1 overflow-hidden rounded-t-2xl",
              className,
            )}
            style={modalContentStyle}
          >
            {children}
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}
