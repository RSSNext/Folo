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
  const nextSource = useMemo(() => {
    if (!source) {
      return ""
    }
    return source.trim()
  }, [source])
  const showTranslation = useGeneralSettingKey("translation")
  const nextTarget = useMemo(() => {
    if (
      !target ||
      !showTranslation ||
      nextSource.replaceAll(/\s/g, "") === target.replaceAll(/\s/g, "")
    ) {
      return ""
    }
    return target.trim()
  }, [nextSource, target, showTranslation])

  if (inline) {
    return (
      <Text {...props} className={className}>
        {`${nextTarget ? `${nextTarget} ` : ""}${nextSource}`}
      </Text>
    )
  }

  return (
    <View>
      {nextTarget && (
        <Text {...props} className={className}>
          {nextTarget}
        </Text>
      )}
      <Text {...props} className={className}>
        {nextSource}
      </Text>
    </View>
  )
}
