import { SafeAreaView, Switch, Text as RNText, View } from "react-native"

import { setUISetting, useUISettingKey } from "@/src/atoms/settings/ui"
import { Slider } from "@/src/components/ui/slider"
import { Text } from "@/src/components/ui/typography/Text"
import type { NavigationControllerView } from "@/src/lib/navigation/types"

export const TextDebugScreen: NavigationControllerView = () => {
  const systemFontScaling = useUISettingKey("useSystemFontScaling")
  const fontScaling = useUISettingKey("fontScale")
  return (
    <SafeAreaView>
      <View className="flex flex-row items-center justify-between p-4">
        <RNText className="text-label font-medium" allowFontScaling={false}>
          Enable system font scaling:{" "}
        </RNText>
        <Switch
          value={systemFontScaling}
          onValueChange={() => {
            setUISetting("useSystemFontScaling", !systemFontScaling)
          }}
        />
      </View>

      <View className="flex p-4">
        <View className="flex flex-row items-center justify-between">
          <RNText className="text-label font-medium" allowFontScaling={false}>
            Setting font scaling:{" "}
          </RNText>

          <RNText className="text-label font-medium">{fontScaling.toFixed(2)}</RNText>
        </View>
        <Slider
          style={{
            marginTop: 16,
          }}
          maximumValue={1.5}
          minimumValue={0.8}
          value={fontScaling}
          onValueChange={(value) => {
            setUISetting("fontScale", value)
          }}
        />
      </View>

      <View>
        <RNText allowFontScaling={false} className="text-label">
          Use React Native Text:
        </RNText>
        <RNText className="text-label text-body">
          Sint eveniet facilis. Occaecati labore temporibus. Nihil qui fuga fugiat provident dolores
          sed. Sed ipsum vel alias. Incidunt iste voluptatibus. Consequatur corrupti deserunt hic
          accusamus.
        </RNText>
      </View>

      <View>
        <RNText allowFontScaling={false} className="text-label">
          Use Text:
        </RNText>
        <Text className="text-label text-body">
          Sint eveniet facilis. Occaecati labore temporibus. Nihil qui fuga fugiat provident dolores
          sed. Sed ipsum vel alias. Incidunt iste voluptatibus. Consequatur corrupti deserunt hic
          accusamus.
        </Text>
      </View>
    </SafeAreaView>
  )
}
