import { cn, regexpPathToPath } from "@follow/utils"
import type { FC } from "react"
import { useMemo } from "react"
import type { UseFormReturn } from "react-hook-form"
import { Clipboard, ScrollView, View } from "react-native"

import { CopyButton } from "@/src/components/common/CopyButton"
import { MonoText } from "@/src/components/ui/typography/MonoText"

export const PreviewUrl: FC<{
  watch: UseFormReturn<any>["watch"]
  path: string
  routePrefix: string
  className?: string
}> = ({ watch, path, routePrefix, className }) => {
  const data = watch()

  const fullPath = useMemo(() => {
    try {
      return regexpPathToPath(path, data)
    } catch (err: unknown) {
      console.info((err as Error).message)
      return path
    }
  }, [path, data])

  const renderedPath = `rsshub://${routePrefix}${fullPath}`
  return (
    <View className={cn("bg-gray-2/20 relative min-w-0 rounded-lg px-4 py-3", className)}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="pr-12"
      >
        <MonoText
          className="text-text/80 w-full whitespace-nowrap break-words text-sm"
          numberOfLines={1}
        >
          {renderedPath}
        </MonoText>
      </ScrollView>
      <CopyButton
        size="tiny"
        onCopy={() => {
          Clipboard.setString(renderedPath)
        }}
        className="absolute right-1.5 top-2"
      />
    </View>
  )
}
