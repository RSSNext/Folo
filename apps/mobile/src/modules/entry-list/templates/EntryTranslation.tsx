import { useMemo } from "react"
import type { TextProps } from "react-native"
import { Text as RNText, View } from "react-native"

import { useGeneralSettingKey } from "@/src/atoms/settings/general"
import { useSpotlightSettingKey } from "@/src/atoms/settings/spotlight"
import { Text } from "@/src/components/ui/typography/Text"
import { HighlightedText } from "@/src/modules/spotlight/HighlightedText"

export const EntryTranslation = ({
  source,
  target,
  className,
  inline,
  showTranslation,
  bilingual,
  ...props
}: {
  source?: string | null
  target?: string | null
  className?: string
  inline?: boolean
  showTranslation?: boolean
  bilingual?: boolean
} & TextProps) => {
  const bilingualFinal = useGeneralSettingKey("translationMode") === "bilingual" || bilingual
  const spotlightRules = useSpotlightSettingKey("spotlights")
  const nextSource = useMemo(() => {
    if (!source) {
      return ""
    }
    return source.trim()
  }, [source])
  const nextTarget = useMemo(() => {
    if (!target || nextSource.replaceAll(/\s/g, "") === target.replaceAll(/\s/g, "")) {
      return ""
    }
    return target.trim()
  }, [nextSource, target])
  if (!bilingualFinal) {
    return (
      <Text {...props} className={className}>
        <HighlightedText text={nextTarget || nextSource} rules={spotlightRules} />
      </Text>
    )
  }
  if (inline) {
    return (
      <Text {...props} className={className}>
        {nextTarget ? <HighlightedText text={nextTarget} rules={spotlightRules} /> : null}
        {nextTarget ? <RNText>{"   ⇋   "}</RNText> : null}
        <HighlightedText text={nextSource} rules={spotlightRules} />
      </Text>
    )
  }
  return (
    <View>
      <Text {...props} className={className}>
        <HighlightedText text={nextSource} rules={spotlightRules} />
      </Text>
      {nextTarget && (
        <Text {...props} className={className}>
          <HighlightedText text={nextTarget} rules={spotlightRules} />
        </Text>
      )}
    </View>
  )
}
