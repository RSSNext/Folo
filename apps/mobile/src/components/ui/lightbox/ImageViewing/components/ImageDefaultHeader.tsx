/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { ViewStyle } from "react-native"
import { StyleSheet, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { CloseCuteReIcon } from "@/src/icons/close_cute_re"
import { Download2CuteReIcon } from "@/src/icons/download_2_cute_re"
import { ShareForwardCuteReIcon } from "@/src/icons/share_forward_cute_re"

type Props = {
  onRequestClose: () => void
  onPressSave: (uri: string) => void
  onPressShare: (uri: string) => void
  currentImageUri?: string
}

const ImageDefaultHeader = ({
  onRequestClose,
  onPressSave,
  onPressShare,
  currentImageUri,
}: Props) => {
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        styles.root,
        { marginTop: insets.top, marginLeft: insets.left, marginRight: insets.right },
      ]}
    >
      {/* Left side - Close button */}
      <View style={styles.leftActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.blurredBackground]}
          onPress={onRequestClose}
          hitSlop={16}
          accessibilityRole="button"
          accessibilityLabel="Close image"
          accessibilityHint="Closes viewer for header image"
          onAccessibilityEscape={onRequestClose}
        >
          <CloseCuteReIcon color="#fff" width={20} height={20} />
        </TouchableOpacity>
      </View>

      {/* Right side - Save and Share buttons */}
      <View style={styles.rightActions}>
        {currentImageUri && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.blurredBackground]}
              onPress={() => onPressSave(currentImageUri)}
              hitSlop={16}
              accessibilityRole="button"
              accessibilityLabel="Save image"
              accessibilityHint="Saves image to photo library"
            >
              <Download2CuteReIcon color="#fff" width={20} height={20} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.blurredBackground]}
              onPress={() => onPressShare(currentImageUri)}
              hitSlop={16}
              accessibilityRole="button"
              accessibilityLabel="Share image"
              accessibilityHint="Shares image with other apps"
            >
              <ShareForwardCuteReIcon color="#fff" width={20} height={20} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 16,
    pointerEvents: "box-none",
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#00000077",
  },
  blurredBackground: {
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  } as ViewStyle,
})

export default ImageDefaultHeader
