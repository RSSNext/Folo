import { ScrollView, View } from "react-native"

import { useReadableContainerStyle, useScaleHeight } from "@/src/lib/responsive"

export const OnboardingSectionScreenContainer = ({ children }: { children: React.ReactNode }) => {
  const height = useScaleHeight()(50)
  const readableContentStyle = useReadableContainerStyle(680)
  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="items-center"
      style={{ marginTop: height }}
    >
      <View style={readableContentStyle}>{children}</View>
    </ScrollView>
  )
}
