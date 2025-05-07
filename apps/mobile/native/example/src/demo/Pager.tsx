/* eslint-disable no-console */
import { useCallback, useRef } from "react"
import { Button, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import type { PagerRef } from "../components/Pager"
import { PagerView } from "../components/Pager"

export const Pager = () => {
  const insets = useSafeAreaInsets()
  const ref = useRef<PagerRef>(null)
  return (
    <View className="flex-1" style={{ paddingTop: insets.top }}>
      <PagerView
        ref={ref}
        pageTotal={10}
        renderPage={useCallback(
          (index: number) => (
            <ScrollView>
              <Pressable
                onPress={() => {
                  console.log("onPress", index)
                }}
              >
                <Text>
                  {index} Suscipit possimus minima hic. Inventore odio vitae facilis labore nobis
                  suscipit cupiditate in possimus. Quaerat quasi exercitationem. Ducimus distinctio
                  rem. Cum quis inventore atque sit cum expedita. Quia aperiam saepe quas
                  reprehenderit labore commodi tempora iusto. Pariatur corrupti deleniti iusto earum
                  sunt natus rem ad. Adipisci quaerat provident dolorum a. Ipsa ratione nesciunt
                  dolore dolorem. Recusandae occaecati voluptate est reiciendis enim. Atque esse
                  fugiat autem. Alias dolore dignissimos aperiam labore maxime laborum. Eveniet ex
                  deserunt. Non fugit officiis excepturi fuga.
                </Text>
              </Pressable>
            </ScrollView>
          ),
          [],
        )}
        transitionStyle="scroll"
        pageGap={100}
        containerStyle={{ flex: 1 }}
        pageContainerStyle={{ backgroundColor: "white", flex: 1, ...StyleSheet.absoluteFillObject }}
        onPageChange={useCallback((index: number) => {
          console.log("onPageChange", index)
        }, [])}
      />
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
