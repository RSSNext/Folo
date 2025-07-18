import { useMemo } from "react"
import type { TextProps } from "react-native"
import { Text, View } from "react-native"

import { useGeneralSettingKey } from "@/src/atoms/settings/general"

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
        {nextTarget || nextSource}
      </Text>
    )
  }

  if (inline) {
    return (
      <Text {...props} className={className}>
        {`${nextTarget ? `${nextTarget}   ⇋   ` : ""}${nextSource}`}
      </Text>
    )
  }

  return (
    <View>
      <Text {...props} className={className}>
        {nextSource}
      </Text>
      {nextTarget && (
        <Text {...props} className={className}>
          {nextTarget}
        </Text>
      )}
    </View>
  )
}
