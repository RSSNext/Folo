/* eslint-disable no-console */
import { useCallback, useEffect, useRef, useState } from "react"
import type { NativeTouchEvent } from "react-native"
import { Button, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import type { PagerRef } from "../components/Pager"
import { PagerView } from "../components/Pager"

export const Pager = () => {
  const insets = useSafeAreaInsets()
  const ref = useRef<PagerRef>(null)

  const touchStartRef = useRef<NativeTouchEvent>()
  const touchMoveRef = useRef<NativeTouchEvent>()

  const [isScroll, setIsScroll] = useState(false)

  useEffect(() => {
    console.log("isScroll state change", isScroll)
  }, [isScroll])
  return (
    <View className="flex-1" style={{ paddingTop: insets.top }}>
      <Pressable
        onPress={() => {
          console.log("onPress")
        }}
        onPressIn={() => {
          console.log("onPressIn")
        }}
        onPressOut={() => {
          console.log("onPressOut")
        }}
        onResponderGrant={() => {
          console.log("onResponderGrant")
        }}
        onTouchStart={(e) => {
          console.log("onTouchStart")
          touchStartRef.current = e.nativeEvent
        }}
        onTouchMove={(e) => {
          touchMoveRef.current = e.nativeEvent
        }}
      >
        <Text>
          Suscipit possimus minima hic. Inventore odio vitae facilis labore nobis suscipit
          cupiditate in possimus. Quaerat quasi exercitationem. Ducimus distinctio rem. Cum quis
          inventore atque sit cum expedita. Quia aperiam saepe quas reprehenderit labore commodi
          tempora iusto. Pariatur corrupti deleniti iusto earum sunt natus rem ad. Adipisci quaerat
          provident dolorum a. Ipsa ratione nesciunt dolore dolorem. Recusandae occaecati voluptate
          est reiciendis enim. Atque esse fugiat autem. Alias dolore dignissimos aperiam labore
          maxime laborum. Eveniet ex deserunt. Non fugit officiis excepturi fuga.
        </Text>
      </Pressable>
      <View className="flex-1">
        <PagerView
          onScrollBegin={() => {
            console.log("onScrollBegin")
            setIsScroll(true)
          }}
          onScrollEnd={() => {
            console.log("onScrollEnd")
            setIsScroll(false)
          }}
          ref={ref}
          pageTotal={10}
          renderPage={useCallback(
            (index: number) => (
              <ScrollView style={{ flex: 1 }}>
                <Pressable
                  unstable_pressDelay={16}
                  disabled={isScroll}
                  onPress={() => {
                    console.log("onPress", isScroll)
                    if (isScroll) {
                      return
                    }
                    console.log("onPress")
                  }}
                  onPressIn={() => {
                    console.log("onPressIn")
                  }}
                  onPressOut={() => {
                    console.log("onPressOut")
                  }}
                  onTouchStart={(e) => {
                    console.log("onTouchStart")
                    touchStartRef.current = e.nativeEvent
                  }}
                  onTouchMove={(e) => {
                    touchMoveRef.current = e.nativeEvent
                  }}
                  onTouchCancel={(e) => {}}
                >
                  <Text>
                    {index} Suscipit possimus minima hic. Inventore odio vitae facilis labore nobis
                    suscipit cupiditate in possimus. Quaerat quasi exercitationem. Ducimus
                    distinctio rem. Cum quis inventore atque sit cum expedita. Quia aperiam saepe
                    quas reprehenderit labore commodi tempora iusto. Pariatur corrupti deleniti
                    iusto earum sunt natus rem ad. Adipisci quaerat provident dolorum a. Ipsa
                    ratione nesciunt dolore dolorem. Recusandae occaecati voluptate est reiciendis
                    enim. Atque esse fugiat autem. Alias dolore dignissimos aperiam labore maxime
                    laborum. Eveniet ex deserunt. Non fugit officiis excepturi fuga.
                  </Text>
                </Pressable>
              </ScrollView>
            ),
            [isScroll],
          )}
          transitionStyle="scroll"
          pageGap={100}
          containerStyle={{ flex: 1 }}
          pageContainerStyle={{
            backgroundColor: "white",
            flex: 1,
            ...StyleSheet.absoluteFillObject,
          }}
          onPageChange={useCallback((index: number) => {
            console.log("onPageChange", index)
          }, [])}
        />
      </View>
      <View
        style={{
          position: "absolute",
          bottom: 30,
          left: 0,
          right: 0,
        }}
      >
        <Button title="Set to End page" onPress={() => ref.current?.setPage(9)} />
      </View>
    </View>
  )
}
