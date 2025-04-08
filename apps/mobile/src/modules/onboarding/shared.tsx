import { ScrollView } from "react-native"

import { useScaleHeight } from "@/src/lib/responsive"

export const OnboardingSectionScreenContainer = ({ children }: { children: React.ReactNode }) => {
  const height = useScaleHeight()(50)
  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="items-center"
      style={{ marginTop: height }}
    >
      {children}
    </ScrollView>
  )
}
