import { legalMarkdown } from "@follow/legal"
import { useMemo } from "react"
import { ScrollView } from "react-native"

import { renderMarkdown } from "@/src/lib/markdown"

export const MarkdownScreen = () => {
  const element = useMemo(() => renderMarkdown(legalMarkdown.tos), [])

  return <ScrollView contentContainerClassName="p-4">{element}</ScrollView>
}
