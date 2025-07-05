/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as React from "react"
import { useState } from "react"
import { ActivityIndicator, StyleSheet } from "react-native"
import type { PanGesture } from "react-native-gesture-handler"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import type { SharedValue } from "react-native-reanimated"
import Animated, {
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated"
import { useSafeAreaFrame } from "react-native-safe-area-context"

import { Image as ProxyImage } from "@/src/components/ui/image/Image"

import type { Dimensions as ImageDimensions, ImageSource, Transform } from "../../@types"

const MAX_ORIGINAL_IMAGE_ZOOM = 2
const MIN_SCREEN_ZOOM = 2

type Props = {
  imageSrc: ImageSource
  onRequestClose: () => void
  onTap: () => void
  onZoom: (scaled: boolean) => void
  onLoad: (dims: ImageDimensions) => void
  isScrollViewBeingDragged: boolean
  showControls: boolean
  measureSafeArea: () => {
    x: number
    y: number
    width: number
    height: number
  }
  imageAspect: number | undefined
  imageDimensions: ImageDimensions | undefined
  dismissSwipePan: PanGesture
  transforms: Readonly<
    SharedValue<{
      scaleAndMoveTransform: Transform
      cropFrameTransform: Transform
      cropContentTransform: Transform
      isResting: boolean
      isHidden: boolean
    }>
  >
}

const ImageItem = ({
  imageSrc,
  onTap,
  onZoom,
  onLoad,
  showControls,
  measureSafeArea,
  imageAspect,
  imageDimensions,
  dismissSwipePan,
  transforms,
}: Props) => {
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>()
  const [scaled, setScaled] = useState(false)
  const isDragging = useSharedValue(false)
  const screenSizeDelayedForJSThreadOnly = useSafeAreaFrame()
  const maxZoomScale = Math.max(
    MIN_SCREEN_ZOOM,
    imageDimensions
      ? (imageDimensions.width / screenSizeDelayedForJSThreadOnly.width) * MAX_ORIGINAL_IMAGE_ZOOM
      : 1,
  )

  const scrollHandler = useAnimatedScrollHandler({
    onScroll(e) {
      "worklet"
      const nextIsScaled = e.zoomScale > 1
      if (scaled !== nextIsScaled) {
        runOnJS(handleZoom)(nextIsScaled)
      }
    },
    onBeginDrag() {
      "worklet"
      isDragging.value = true
    },
    onEndDrag() {
      "worklet"
      isDragging.value = false
    },
  })

  function handleZoom(nextIsScaled: boolean) {
    onZoom(nextIsScaled)
    setScaled(nextIsScaled)
  }

  function zoomTo(nextZoomRect: { x: number; y: number; width: number; height: number }) {
    const scrollResponderRef = scrollViewRef?.current?.getScrollResponder()
    // @ts-ignore
    scrollResponderRef?.scrollResponderZoomTo({
      ...nextZoomRect, // This rect is in screen coordinates
      animated: true,
    })
  }

  const singleTap = Gesture.Tap().onEnd(() => {
    "worklet"
    runOnJS(onTap)()
  })

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      "worklet"
      const screenSize = measureSafeArea()
      const { absoluteX, absoluteY } = e
      let nextZoomRect = {
        x: 0,
        y: 0,
        width: screenSize.width,
        height: screenSize.height,
      }
      const willZoom = !scaled
      if (willZoom) {
        nextZoomRect = getZoomRectAfterDoubleTap(imageAspect, absoluteX, absoluteY, screenSize)
      }
      runOnJS(zoomTo)(nextZoomRect)
    })

  const composedGesture = Gesture.Exclusive(dismissSwipePan, doubleTap, singleTap)

  const containerStyle = useAnimatedStyle(() => {
    const { scaleAndMoveTransform, isHidden } = transforms.get()
    return {
      flex: 1,
      transform: scaleAndMoveTransform,
      opacity: isHidden ? 0 : 1,
    }
  })

  const imageCropStyle = useAnimatedStyle(() => {
    const screenSize = measureSafeArea()
    const { cropFrameTransform } = transforms.get()
    return {
      overflow: "hidden",
      transform: cropFrameTransform,
      width: screenSize.width,
      maxHeight: screenSize.height,
      alignSelf: "center",
      aspectRatio: imageAspect ?? 1 /* force onLoad */,
      opacity: imageAspect === undefined ? 0 : 1,
    }
  })

  const imageStyle = useAnimatedStyle(() => {
    const { cropContentTransform } = transforms.get()
    return {
      transform: cropContentTransform,
      width: "100%",
      aspectRatio: imageAspect ?? 1 /* force onLoad */,
      opacity: imageAspect === undefined ? 0 : 1,
    }
  })

  const [showLoader, setShowLoader] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  useAnimatedReaction(
    () => {
      return transforms.get().isResting && !hasLoaded
    },
    (show, prevShow) => {
      if (!prevShow && show) {
        runOnJS(setShowLoader)(true)
      } else if (prevShow && !show) {
        runOnJS(setShowLoader)(false)
      }
    },
  )

  const { type } = imageSrc
  const borderRadius = type === "circle-avi" ? 1e5 : type === "rect-avi" ? 20 : 0

  const scrollViewProps = useAnimatedProps(() => ({
    // Don't allow bounce at 1:1 rest so it can be swiped away.
    bounces: scaled || isDragging.value,
  }))

  return (
    <GestureDetector gesture={composedGesture}>
      {/* Wrap a extra view to prevent https://github.com/software-mansion/react-native-reanimated/issues/6829 */}
      <Animated.View style={containerStyle}>
        <Animated.ScrollView
          // @ts-ignore Something's up with the types here
          ref={scrollViewRef}
          pinchGestureEnabled
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          maximumZoomScale={maxZoomScale}
          onScroll={scrollHandler}
          // style={containerStyle}
          contentContainerClassName="flex-1 items-center justify-center"
          animatedProps={scrollViewProps}
          centerContent
        >
          {showLoader && <ActivityIndicator size="small" color="#FFF" style={styles.loading} />}
          <Animated.View style={imageCropStyle}>
            <Animated.View style={imageStyle}>
              <ProxyImage
                contentFit="contain"
                source={{ uri: imageSrc.uri }}
                placeholderContentFit="contain"
                placeholder={{ uri: imageSrc.thumbUri }}
                style={{ flex: 1, borderRadius, backgroundColor: "transparent" }}
                accessibilityLabel={imageSrc.alt}
                accessibilityHint=""
                enableLiveTextInteraction={showControls && !scaled}
                accessibilityIgnoresInvertColors
                priority="high"
                onLoad={
                  hasLoaded
                    ? undefined
                    : (e) => {
                        setHasLoaded(true)
                        onLoad({ width: e.source.width, height: e.source.height })
                      }
                }
              />
            </Animated.View>
          </Animated.View>
        </Animated.ScrollView>
      </Animated.View>
    </GestureDetector>
  )
}

const styles = StyleSheet.create({
  loading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  image: {
    flex: 1,
  },
})

const getZoomRectAfterDoubleTap = (
  imageAspect: number | undefined,
  touchX: number,
  touchY: number,
  screenSize: { width: number; height: number },
): {
  x: number
  y: number
  width: number
  height: number
} => {
  "worklet"
  if (!imageAspect) {
    return {
      x: 0,
      y: 0,
      width: screenSize.width,
      height: screenSize.height,
    }
  }

  // First, let's figure out how much we want to zoom in.
  // We want to try to zoom in at least close enough to get rid of black bars.
  const screenAspect = screenSize.width / screenSize.height
  const zoom = Math.max(imageAspect / screenAspect, screenAspect / imageAspect, MIN_SCREEN_ZOOM)
  // Unlike in the Android version, we don't constrain the *max* zoom level here.
  // Instead, this is done in the ScrollView props so that it constraints pinch too.

  // Next, we'll be calculating the rectangle to "zoom into" in screen coordinates.
  // We already know the zoom level, so this gives us the rectangle size.
  const rectWidth = screenSize.width / zoom
  const rectHeight = screenSize.height / zoom

  // Before we settle on the zoomed rect, figure out the safe area it has to be inside.
  // We don't want to introduce new black bars or make existing black bars unbalanced.
  let minX = 0
  let minY = 0
  let maxX = screenSize.width - rectWidth
  let maxY = screenSize.height - rectHeight
  if (imageAspect >= screenAspect) {
    // The image has horizontal black bars. Exclude them from the safe area.
    const renderedHeight = screenSize.width / imageAspect
    const horizontalBarHeight = (screenSize.height - renderedHeight) / 2
    minY += horizontalBarHeight
    maxY -= horizontalBarHeight
  } else {
    // The image has vertical black bars. Exclude them from the safe area.
    const renderedWidth = screenSize.height * imageAspect
    const verticalBarWidth = (screenSize.width - renderedWidth) / 2
    minX += verticalBarWidth
    maxX -= verticalBarWidth
  }

  // Finally, we can position the rect according to its size and the safe area.
  let rectX
  if (maxX >= minX) {
    // Content fills the screen horizontally so we have horizontal wiggle room.
    // Try to keep the tapped point under the finger after zoom.
    rectX = touchX - touchX / zoom
    rectX = Math.min(rectX, maxX)
    rectX = Math.max(rectX, minX)
  } else {
    // Keep the rect centered on the screen so that black bars are balanced.
    rectX = screenSize.width / 2 - rectWidth / 2
  }
  let rectY
  if (maxY >= minY) {
    // Content fills the screen vertically so we have vertical wiggle room.
    // Try to keep the tapped point under the finger after zoom.
    rectY = touchY - touchY / zoom
    rectY = Math.min(rectY, maxY)
    rectY = Math.max(rectY, minY)
  } else {
    // Keep the rect centered on the screen so that black bars are balanced.
    rectY = screenSize.height / 2 - rectHeight / 2
  }

  return {
    x: rectX,
    y: rectY,
    height: rectHeight,
    width: rectWidth,
  }
}

export default React.memo(ImageItem)
