import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import { cn } from "@follow/utils"
import { repository } from "@pkg"
import type { FC } from "react"
import {
  Suspense,
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { Trans } from "react-i18next"
import { useLoaderData } from "react-router"

import { ModalClose } from "~/components/ui/modal/stacked/components"
import { SettingsTitle } from "~/modules/settings/title"

import { useAvailableSettings } from "../hooks/use-setting-ctx"
import { SettingSectionHighlightContext } from "../section"
import { getSettingPages } from "../settings-glob"
import type { SettingPageConfig } from "../utils"
import { SettingTabProvider, useSettingTab } from "./context"
import { SettingModalLayout } from "./layout"

export const SettingModalContent: FC<{
  initialTab?: string
  initialSection?: string
}> = ({ initialTab, initialSection }) => {
  const pages = getSettingPages()

  const availableSettings = useAvailableSettings()

  const resolvedInitialTab =
    initialTab && initialTab in pages ? initialTab : availableSettings[0]!.path

  return (
    <SettingTabProvider initialTab={resolvedInitialTab}>
      <SettingModalLayout>
        <Content initialSection={initialSection} />
      </SettingModalLayout>
    </SettingTabProvider>
  )
}

const Content: FC<{
  initialSection?: string
}> = ({ initialSection }) => {
  const key = useDeferredValue(useSettingTab() || "general")
  const pages = getSettingPages()
  const { Component, loader } = pages[key]

  const [scroller, setScroller] = useState<HTMLDivElement | null>(null)
  const sectionRefs = useRef(new Map<string, HTMLElement>())
  const pendingSectionRef = useRef<string | null>(initialSection ?? null)
  const hasAppliedInitialSectionRef = useRef(false)
  const [highlightedSectionId, setHighlightedSectionId] = useState<string | undefined>()

  useEffect(() => {
    pendingSectionRef.current = initialSection ?? null
    hasAppliedInitialSectionRef.current = false
    setHighlightedSectionId(undefined)
  }, [initialSection])

  useLayoutEffect(() => {
    if (scroller) {
      scroller.scrollTop = 0
    }
  }, [key])

  const scrollToSection = useCallback((sectionId: string) => {
    if (!sectionId) return false
    const element = sectionRefs.current.get(sectionId)
    if (!element) return false

    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })

    setHighlightedSectionId(sectionId)

    return true
  }, [])

  const registerSection = useCallback(
    (sectionId: string, element: HTMLElement | null) => {
      if (!sectionId) return
      if (element) {
        sectionRefs.current.set(sectionId, element)
        if (pendingSectionRef.current === sectionId) {
          const handled = scrollToSection(sectionId)
          if (handled) {
            pendingSectionRef.current = null
            hasAppliedInitialSectionRef.current = true
          }
        }
      } else {
        sectionRefs.current.delete(sectionId)
      }
    },
    [scrollToSection],
  )

  useEffect(() => {
    if (!initialSection || hasAppliedInitialSectionRef.current) return

    const handled = scrollToSection(initialSection)
    if (handled) {
      hasAppliedInitialSectionRef.current = true
      pendingSectionRef.current = null
    } else {
      pendingSectionRef.current = initialSection
    }
  }, [initialSection, key, scrollToSection])

  const highlightContextValue = useMemo(
    () => ({
      highlightedSectionId: highlightedSectionId ?? undefined,
      registerSection,
    }),
    [highlightedSectionId, registerSection],
  )

  const config = (useLoaderData() || loader || {}) as SettingPageConfig
  if (!Component) return null

  return (
    <Suspense>
      <SettingsTitle loader={loader} className="relative mb-0 px-8" />
      <ModalClose />
      <ScrollArea.ScrollArea
        mask={false}
        ref={setScroller}
        rootClassName="h-full grow flex-1 shrink-0 overflow-auto"
        viewportClassName={cn(
          "px-1 min-h-full [&>div]:min-h-full [&>div]:relative pl-8 pr-7",
          config.viewportClassName,
        )}
      >
        <SettingSectionHighlightContext value={highlightContextValue}>
          <Component />
        </SettingSectionHighlightContext>

        <div className="h-16" />
        <p className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-1 text-xs opacity-80">
          <Trans
            ns="settings"
            i18nKey="common.give_star"
            components={{
              Link: (
                <a
                  href={`${repository.url}`}
                  className="font-semibold text-accent"
                  target="_blank"
                />
              ),
              HeartIcon: <i className="i-mgc-heart-cute-fi" />,
            }}
          />
        </p>
      </ScrollArea.ScrollArea>
    </Suspense>
  )
}
