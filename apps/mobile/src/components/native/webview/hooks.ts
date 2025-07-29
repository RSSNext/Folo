import { useEntry } from "@follow/store/entry/hooks"
import { useEntryTranslation } from "@follow/store/translation/hooks"
import { useEffect, useMemo, useRef, useState } from "react"
import { PixelRatio } from "react-native"

import { useActionLanguage } from "@/src/atoms/settings/general"
import { useUISettingKey } from "@/src/atoms/settings/ui"

import { prepareEntryRenderWebView } from "./index"
import { WebViewManager } from "./webview-manager"

interface UseWebViewEntryOptions {
  entryId: string
  noMedia?: boolean
  showReadability?: boolean
  showTranslation?: boolean
}

/**
 * Hook to prepare the entry render WebView with proper cleanup and error handling
 * Ensures the WebView is only initialized once per component lifecycle
 */
export const usePrepareEntryRenderWebView = () => {
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return

    try {
      prepareEntryRenderWebView()
      initializedRef.current = true
    } catch (error) {
      console.error("Failed to prepare entry render WebView:", error)
    }
  }, [])

  return initializedRef.current
}

/**
 * Custom hook to manage WebView entry content and settings
 * Handles all WebView JavaScript bridge calls in a centralized way
 */
export function useWebViewEntry({
  entryId,
  noMedia,
  showReadability,
  showTranslation,
}: UseWebViewEntryOptions) {
  const entry = useEntry(entryId, (state) => state)
  const language = useActionLanguage()
  const translation = useEntryTranslation({
    entryId,
    language,
    setting: showTranslation ?? false,
  })

  // UI Settings
  const codeThemeLight = useUISettingKey("codeHighlightThemeLight")
  const codeThemeDark = useUISettingKey("codeHighlightThemeDark")
  const readerRenderInlineStyle = useUISettingKey("readerRenderInlineStyle")
  const useSystemFontScaling = useUISettingKey("useSystemFontScaling")
  const customFontScale = useUISettingKey("fontScale")
  const useDifferentFontSizeForContent = useUISettingKey("useDifferentFontSizeForContent")
  const mobileContentFontSize = useUISettingKey("mobileContentFontSize")

  useEffect(() => {
    const fontScale = useSystemFontScaling ? PixelRatio.getFontScale() : customFontScale
    WebViewManager.setRootFontSize(fontScale * 16)
  }, [useSystemFontScaling, customFontScale])

  // Handle content-specific font size
  useEffect(() => {
    if (useDifferentFontSizeForContent) {
      WebViewManager.setRootFontSize(mobileContentFontSize)
    } else {
      // Reset to use the global font scaling
      const fontScale = useSystemFontScaling ? PixelRatio.getFontScale() : customFontScale
      WebViewManager.setRootFontSize(fontScale * 16)
    }
  }, [useDifferentFontSizeForContent, mobileContentFontSize, useSystemFontScaling, customFontScale])

  // Prepare entry data for WebView
  const entryInWebview = useMemo(() => {
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

  // Update WebView settings when dependencies change
  useEffect(() => {
    WebViewManager.setNoMedia(!!noMedia)
  }, [noMedia])

  useEffect(() => {
    WebViewManager.setReaderRenderInlineStyle(readerRenderInlineStyle)
  }, [readerRenderInlineStyle])

  useEffect(() => {
    WebViewManager.setCodeTheme(codeThemeLight, codeThemeDark)
  }, [codeThemeLight, codeThemeDark])

  useEffect(() => {
    WebViewManager.setEntry(entryInWebview)
  }, [entryInWebview])

  return {
    entry,
    entryInWebview,
    translation,
    isLoading: showReadability ? !entry?.readabilityContent : !entry?.content,
  }
}

/**
 * Hook for managing WebView mode switching (debug/normal)
 */
export function useWebViewMode() {
  const [mode, setMode] = useState<"normal" | "debug">("normal")
  const handleModeSwitch = (mode: "normal" | "debug") => {
    setMode(mode)
    if (mode === "debug") {
      WebViewManager.loadUrl("http://localhost:5173/")
    } else {
      const { htmlUrl } = require("./constants")
      WebViewManager.loadUrl(htmlUrl)
    }
  }

  return { handleModeSwitch, mode }
}
