import { useMemo } from "react"
import type { TextProps } from "react-native"
import { Text, View } from "react-native"

import { useGeneralSettingKey } from "@/src/atoms/settings/general"

export const EntryTranslation = ({
  source,
  target,
  className,
  inline,
  ...props
}: {
  source?: string | null
  target?: string
  className?: string
  inline?: boolean
} & TextProps) => {
  const showTranslation = useGeneralSettingKey("translation")

  const nextTarget = useMemo(() => {
    if (!target || !showTranslation || source === target) {
      return ""
    }
    return target
  }, [source, target, showTranslation])

  if (!source) {
    return null
  }

  if (inline) {
    return (
      <Text {...props} className={className}>
        {`${nextTarget.trim()}${source.trim()}`}
      </Text>
    )
  }

  return (
    <View>
      {nextTarget && (
        <Text {...props} className={className}>
          {nextTarget.trim()}
        </Text>
      )}
      <Text {...props} className={className}>
        {source.trim()}
      </Text>
    </View>
  )
}
