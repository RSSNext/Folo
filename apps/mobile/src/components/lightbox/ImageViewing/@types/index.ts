/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ImageProps } from "expo-image"
import type { TransformsStyle } from "react-native"
import type { MeasuredDimensions } from "react-native-reanimated"

export type Dimensions = {
  width: number
  height: number
}

export type Position = {
  x: number
  y: number
}

export type LightboxImageSource = {
  uri: string
  dimensions: Dimensions | null
  thumbUri: ImageProps["placeholder"]
  thumbDimensions: Dimensions | null
  thumbRect: MeasuredDimensions | null
  alt?: string
  type: "image" | "circle-avi" | "rect-avi"
}

export type Transform = Exclude<TransformsStyle["transform"], string | undefined>
