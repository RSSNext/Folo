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

type Props = {
  onRequestClose: () => void
}

const ImageDefaultHeader = ({ onRequestClose }: Props) => {
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.root, { marginTop: insets.top, marginRight: insets.right }]}>
      <TouchableOpacity
        style={[styles.closeButton, styles.blurredBackground]}
        onPress={onRequestClose}
        hitSlop={16}
        accessibilityRole="button"
        accessibilityLabel={`Close image`}
        accessibilityHint={`Closes viewer for header image`}
        onAccessibilityEscape={onRequestClose}
      >
        <CloseCuteReIcon color="#fff" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    alignItems: "flex-end",
    pointerEvents: "box-none",
  },
  closeButton: {
    marginRight: 10,
    marginTop: 10,
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
