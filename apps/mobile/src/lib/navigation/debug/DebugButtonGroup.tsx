/* eslint-disable no-console */
import { useEffect, useRef } from "react"
import { Button, SafeAreaView, ScrollView, TouchableOpacity, View } from "react-native"

import { FullWindowOverlay } from "@/src/components/common/FullWindowOverlay"
import { Text } from "@/src/components/ui/typography/Text"
import { CloseCuteReIcon } from "@/src/icons/close_cute_re"

import { useNavigation } from "../hooks"
import { Navigation } from "../Navigation"
import type { NavigationControllerView } from "../types"

export const DebugButtonGroup = () => {
  useEffect(() => {
    const disposers: (() => void)[] = []
    disposers.push(
      Navigation.rootNavigation.on("willAppear", (payload) => {
        console.log("willAppear", payload)
      }),
      Navigation.rootNavigation.on("didAppear", (payload) => {
        console.log("didAppear", payload)
      }),
      Navigation.rootNavigation.on("willDisappear", (payload) => {
        console.log("willDisappear", payload)
      }),
      Navigation.rootNavigation.on("didDisappear", (payload) => {
        console.log("didDisappear", payload)
      }),
    )
    return () => {
      disposers.forEach((disposer) => disposer())
    }
  }, [])
  const cntRef = useRef(0)
  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView>
        <Text>
          Ad eveniet laboriosam hic voluptas non facilis sint. Laborum rem et provident blanditiis
          iure rem. Porro voluptate ipsa explicabo voluptatem cumque est architecto. Sit
          voluptatibus exercitationem recusandae cupiditate tenetur inventore amet repellendus
          ratione. Nobis nulla harum soluta aliquam iure unde saepe. Modi ipsam harum aspernatur
          aperiam quod pariatur nisi corporis. Doloribus molestiae a dolore. Veniam commodi nesciunt
          beatae itaque aliquid nemo. Ut labore rem voluptates. Reprehenderit recusandae voluptate
          earum consectetur tempora corrupti. Nulla ducimus enim sit ipsam eum esse debitis saepe.
          Nobis ut voluptas. Id sapiente voluptate soluta ipsa esse corrupti facere nemo recusandae.
          Dignissimos eum mollitia hic corrupti. Reiciendis voluptates et provident sed laborum
          consequuntur. Quod nemo nesciunt dignissimos doloribus veniam odio.
        </Text>
      </SafeAreaView>
      <FullWindowOverlay>
        <View className="absolute inset-x-0 bottom-24">
          <Button
            title="Push"
            onPress={() => {
              Navigation.rootNavigation.pushControllerView(
                cntRef.current++ % 2 === 0 ? TestScreen : TestScreen3,
              )
            }}
          />
          <Button
            title="formSheet"
            onPress={() => {
              Navigation.rootNavigation.presentControllerView(
                cntRef.current++ % 2 === 0 ? TestScreen : TestScreen3,
                void 0,
                "formSheet",
              )
            }}
          />
          <Button
            title="Modal"
            onPress={() => {
              Navigation.rootNavigation.presentControllerView(
                cntRef.current++ % 2 === 0 ? TestScreen : TestScreen3,
              )
            }}
          />
          <Button
            title="Transparent Modal"
            onPress={() => {
              Navigation.rootNavigation.presentControllerView(
                cntRef.current++ % 2 === 0 ? TestScreen : TestScreen3,
                void 0,
                "transparentModal",
              )
            }}
          />
          <Button
            title="Full Screen Modal"
            onPress={() => {
              Navigation.rootNavigation.presentControllerView(
                cntRef.current++ % 2 === 0 ? TestScreen : TestScreen3,
                void 0,
                "fullScreenModal",
              )
            }}
          />
        </View>
      </FullWindowOverlay>
    </View>
  )
}
const TestScreen3: NavigationControllerView = () => {
  const navigation = useNavigation()
  return (
    <View className="flex-1 bg-white">
      <TouchableOpacity
        className="absolute right-5 top-12 z-10 p-4"
        onPress={() => {
          navigation.back()
        }}
      >
        <CloseCuteReIcon height={20} width={20} color="black" />
      </TouchableOpacity>

      <Text>TestScreen3</Text>
      <Text>Hello2</Text>
      <Text>Hello2</Text>
      <Text>Hello2</Text>
      <Text>Hello2</Text>
      <Text>Hello2</Text>
      <Text>Hello2</Text>
      <Text>Hello2</Text>
      <Text>Hello2</Text>
      <Text>Hello2</Text>
    </View>
  )
}
TestScreen3.sheetAllowedDetents = [0.7, 1]
TestScreen3.sheetCornerRadius = 0
const TestScreen: NavigationControllerView = () => {
  const navigation = useNavigation()
  return (
    <View className="flex-1">
      <TouchableOpacity
        className="absolute right-5 top-12 z-10 p-4"
        onPress={() => {
          navigation.back()
        }}
      >
        <CloseCuteReIcon height={20} width={20} color="black" />
      </TouchableOpacity>
      <ScrollView className="flex-1 bg-white">
        {Array.from({
          length: 100,
        }).map((_, index) => {
          return (
            <Text key={index} className="text-black">
              TestScreen
            </Text>
          )
        })}
      </ScrollView>
    </View>
  )
}
TestScreen.sheetAllowedDetents = [0.5, 1]
