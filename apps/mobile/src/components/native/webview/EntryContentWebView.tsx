import { useEntry } from "@follow/store/entry/hooks"
import type { EntryModel } from "@follow/store/entry/types"
import { useEntryTranslation } from "@follow/store/translation/hooks"
import { clsx } from "@follow/utils"
import { Portal } from "@gorhom/portal"
import { useAtom } from "jotai"
import * as React from "react"
import { useEffect } from "react"
import { TouchableOpacity, View } from "react-native"

import { useActionLanguage } from "@/src/atoms/settings/general"
import { useUISettingKey } from "@/src/atoms/settings/ui"
import { BugCuteReIcon } from "@/src/icons/bug_cute_re"

import { PlatformActivityIndicator } from "../../ui/loading/PlatformActivityIndicator"
import { sharedWebViewHeightAtom } from "./atom"
import { htmlUrl } from "./constants"
import { prepareEntryRenderWebView, SharedWebViewModule } from "./index"
import { NativeWebView } from "./native-webview"

type EntryContentWebViewProps = {
  entryId: string
  noMedia?: boolean
  showReadability?: boolean
  showTranslation?: boolean
}

const setCodeTheme = (light: string, dark: string) => {
  SharedWebViewModule.evaluateJavaScript(
    `setCodeTheme(${JSON.stringify(light)}, ${JSON.stringify(dark)})`,
  )
}

const setWebViewEntry = (entry?: EntryModel | null) => {
  if (!entry) return
  SharedWebViewModule.evaluateJavaScript(
    `setEntry(JSON.parse(${JSON.stringify(JSON.stringify(entry))}))`,
  )
}
export { setWebViewEntry as preloadWebViewEntry }

const setNoMedia = (value: boolean) => {
  SharedWebViewModule.evaluateJavaScript(`setNoMedia(${value})`)
}

const setReaderRenderInlineStyle = (value: boolean) => {
  SharedWebViewModule.evaluateJavaScript(`setReaderRenderInlineStyle(${value})`)
}

export function EntryContentWebView(props: EntryContentWebViewProps) {
  const [contentHeight, setContentHeight] = useAtom(sharedWebViewHeightAtom)

  const codeThemeLight = useUISettingKey("codeHighlightThemeLight")
  const codeThemeDark = useUISettingKey("codeHighlightThemeDark")
  const readerRenderInlineStyle = useUISettingKey("readerRenderInlineStyle")
  const { entryId, noMedia, showReadability, showTranslation } = props
  const entry = useEntry(entryId, (state) => state)
  const language = useActionLanguage()
  const translation = useEntryTranslation(entryId, language)

  const [mode, setMode] = React.useState<"normal" | "debug">("normal")

  useEffect(() => {
    setNoMedia(!!noMedia)
  }, [noMedia, mode])

  useEffect(() => {
    setReaderRenderInlineStyle(readerRenderInlineStyle)
  }, [readerRenderInlineStyle, mode])

  useEffect(() => {
    setCodeTheme(codeThemeLight, codeThemeDark)
  }, [codeThemeLight, codeThemeDark, mode])

  const entryInWebview = React.useMemo(() => {
    if (!entry) return null

    const entryContent = showReadability ? entry?.readabilityContent : entry?.content
    const translatedContent = showReadability
      ? translation?.readabilityContent
      : translation?.content
    const content = showTranslation ? translatedContent || entryContent : entryContent

    return {
      ...entry,
      content,
    }
  }, [
    entry,
    showReadability,
    showTranslation,
    translation?.content,
    translation?.readabilityContent,
  ])

  useEffect(() => {
    setWebViewEntry(entryInWebview)
  }, [entryInWebview])

  const onceRef = React.useRef(false)
  if (!onceRef.current) {
    onceRef.current = true
    prepareEntryRenderWebView()
  }

  return (
    <>
      <View
        key={mode}
        style={{ height: contentHeight, transform: [{ translateY: 0 }] }}
        onLayout={() => {
          setWebViewEntry(entryInWebview)
        }}
      >
        <NativeWebView
          onContentHeightChange={(e) => {
            setContentHeight(e.nativeEvent.height)
          }}
        />
      </View>

      <Portal>
        {(showReadability ? !entry?.readabilityContent : !entry?.content) && (
          <View className="absolute inset-0 items-center justify-center">
            <PlatformActivityIndicator />
          </View>
        )}
      </Portal>
      {__DEV__ && (
        <Portal>
          <View className="bottom-safe-offset-2 absolute left-4 flex-row gap-4">
            <TouchableOpacity
              className={clsx(
                "flex size-12 items-center justify-center rounded-full",
                mode === "debug" ? "bg-yellow" : "bg-red",
              )}
              onPress={() => {
                const nextMode = mode === "debug" ? "normal" : "debug"
                setMode(nextMode)
                if (nextMode === "debug") {
                  SharedWebViewModule.load("http://localhost:5173/")
                } else {
                  SharedWebViewModule.load(htmlUrl)
                }
              }}
            >
              <BugCuteReIcon color="#fff" />
            </TouchableOpacity>
          </View>
        </Portal>
      )}
    </>
  )
}
