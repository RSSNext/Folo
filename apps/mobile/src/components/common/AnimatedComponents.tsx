import { Animated, FlatList, Pressable, ScrollView, TouchableOpacity } from "react-native"
import Reanimated from "react-native-reanimated"

import { Image } from "@/src/components/ui/image/Image"

export const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView)
export const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)
export const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity)

export const ReAnimateImage = Reanimated.createAnimatedComponent(Image)
export const ReAnimatedPressable = Reanimated.createAnimatedComponent(Pressable)
export const ReAnimatedScrollView = Reanimated.createAnimatedComponent(ScrollView)
export const ReAnimatedTouchableOpacity = Reanimated.createAnimatedComponent(TouchableOpacity)
