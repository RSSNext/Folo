import { Image as ExpoImage } from "expo-image"
import { Animated, FlatList, Pressable, ScrollView, TouchableOpacity } from "react-native"
import Reanimated from "react-native-reanimated"

export const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView)
export const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)
export const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity)

export const ReAnimatedExpoImage = Reanimated.createAnimatedComponent(ExpoImage)
export const ReAnimatedPressable = Reanimated.createAnimatedComponent(Pressable)
export const ReAnimatedScrollView = Reanimated.createAnimatedComponent(ScrollView)
export const ReAnimatedTouchableOpacity = Reanimated.createAnimatedComponent(TouchableOpacity)
