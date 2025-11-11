import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import { clsx, cn } from "@follow/utils"
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
import { SettingSectionHighlightIdContext } from "../section"
import { getSettingPages } from "../settings-glob"
import type { SettingPageConfig } from "../utils"
import { SettingTabProvider, useSetSettingTab, useSettingTab } from "./context"
import { SettingModalLayout } from "./layout"

export const SettingModalContent: FC<{
  initialTab?: string
  initialSection?: string
}> = ({ initialTab, initialSection }) => {
  const pages = getSettingPages()

  const availableSettings = useAvailableSettings()

  const fallbackTab = availableSettings[0]?.path
  const availablePaths = useMemo(
    () => new Set(availableSettings.map((setting) => setting.path)),
    [availableSettings],
  )
  const canUseInitialTab =
    typeof initialTab === "string" && initialTab in pages && availablePaths.has(initialTab)
  const resolvedInitialTab = canUseInitialTab ? initialTab : fallbackTab

  if (!resolvedInitialTab) {
    return null
  }

  return (
    <SettingTabProvider initialTab={resolvedInitialTab}>
      <SettingModalLayout>
        <Content initialSection={initialSection} />
      </SettingModalLayout>
    </SettingTabProvider>
  )
}

const Content: FC<{
  initialSection?: string | null
}> = ({ initialSection }) => {
  const availableSettings = useAvailableSettings()
  const tab = useSettingTab()
  const setTab = useSetSettingTab()

  useEffect(() => {
    if (availableSettings.length === 0) return
    if (!tab || !availableSettings.some((setting) => setting.path === tab)) {
      setTab(availableSettings[0]!.path)
    }
  }, [availableSettings, setTab, tab])

  const activeSetting = useMemo(() => {
    if (availableSettings.length === 0) return
    if (tab) {
      const matched = availableSettings.find((setting) => setting.path === tab)
      if (matched) {
        return matched
      }
    }
    return availableSettings[0]
  }, [availableSettings, tab])

  const key = useDeferredValue(activeSetting?.path ?? "")
  const pages = getSettingPages()
  const page = key ? pages[key] : undefined
  const Component = page?.Component
  const loader = page?.loader

  const [scrollerAtTop, setScrollerAtTop] = useState(true)
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null)

  const pendingSectionRef = useRef<string | null>(initialSection ?? null)
  const hasAppliedInitialSectionRef = useRef(false)

  useEffect(() => {
    pendingSectionRef.current = initialSection ?? null
    hasAppliedInitialSectionRef.current = false
  }, [initialSection])

  useLayoutEffect(() => {
    if (scroller) {
      scroller.scrollTop = 0
    }
  }, [key, scroller])

  useEffect(() => {
    if (!scroller) return
    const handler = () => {
      setScrollerAtTop(scroller.scrollTop < 20)
    }
    scroller.addEventListener("scroll", handler)
    return () => {
      scroller.removeEventListener("scroll", handler)
    }
  }, [scroller])

  const scrollToSection = useCallback(
    (sectionId: string) => {
      if (!sectionId) return false
      if (!scroller) return false
      const element = scroller.querySelector(`[data-setting-section="${sectionId}"]`) as HTMLElement
      if (!element) return false

      const elementTop = element.offsetTop
      const scrollerTop = scroller.scrollTop
      const delta = elementTop - scrollerTop

      scroller.scrollTo({
        top: delta,
        behavior: "smooth",
      })

      return true
    },
    [scroller],
  )

  useEffect(() => {
    if (initialSection) {
      scrollToSection(initialSection)
    }
  }, [initialSection, scrollToSection])

  const config = (useLoaderData() || loader || {}) as SettingPageConfig
  if (!Component || !activeSetting) return null

  return (
    <Suspense>
      <SettingsTitle
        loader={loader}
        className={clsx(
          "relative mb-0 border-b border-transparent px-8 transition-colors duration-200",
          !scrollerAtTop ? "border-border" : "",
        )}
      />
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
        <SettingSectionHighlightIdContext value={initialSection!}>
          <Component />
        </SettingSectionHighlightIdContext>

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
