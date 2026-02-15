import { Animated, FlatList, Pressable, ScrollView } from "react-native"
import Reanimated from "react-native-reanimated"

import { Image } from "@/src/components/ui/image/Image"

export const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView)
export const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)
export const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export const ReAnimateImage = Reanimated.createAnimatedComponent(Image)
export const ReAnimatedPressable = Reanimated.createAnimatedComponent(Pressable)
export const ReAnimatedScrollView = Reanimated.createAnimatedComponent(ScrollView)
