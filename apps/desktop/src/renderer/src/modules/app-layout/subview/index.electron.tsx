import { getReadonlyRoute } from "@follow/components/atoms/route.js"
import { MotionButtonBase } from "@follow/components/ui/button/index.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import { Routes } from "@follow/constants"
import { springScrollTo } from "@follow/utils/scroller"
import { cn, getOS } from "@follow/utils/utils"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { NavigationType, Outlet, useLocation, useNavigate, useNavigationType } from "react-router"

import { FABContainer, FABPortable } from "~/components/ui/fab"
import { isElectronBuild } from "~/constants"

import { useSubViewTitleValue } from "./hooks"

export function SubviewLayout() {
  const navigate = useNavigate()
  const prevLocation = useRef(getReadonlyRoute().location).current
  const title = useSubViewTitleValue()
  const [scrollRef, setRef] = useState(null as HTMLDivElement | null)
  const [isTitleSticky, setIsTitleSticky] = useState(false)
  const navigationType = useNavigationType()
  const location = useLocation()

  useEffect(() => {
    // Scroll to top search bar when re-navigating to Discover page while already on it
    if (
      navigationType === NavigationType.Replace &&
      location.pathname === Routes.Discover &&
      scrollRef
    ) {
      springScrollTo(0, scrollRef)
    }
  }, [location, navigationType, scrollRef])

  useEffect(() => {
    const $scroll = scrollRef

    if (!$scroll) return

    springScrollTo(0, $scroll)
    const handler = () => {
      setIsTitleSticky($scroll.scrollTop > 120)
    }
    $scroll.addEventListener("scroll", handler)
    return () => {
      $scroll.removeEventListener("scroll", handler)
    }
  }, [scrollRef])

  const { t } = useTranslation()

  // electron window has pt-[calc(var(--fo-window-padding-top)_-10px)]
  const isElectronWindows = isElectronBuild && getOS() === "Windows"

  return (
    <div className="relative flex size-full">
      <div
        className={cn(
          "absolute inset-x-0 top-0 z-10 p-4",
          "grid grid-cols-[1fr_auto_1fr] items-center gap-4",
          isTitleSticky && "group border-b bg-zinc-50/80 backdrop-blur-xl dark:bg-neutral-900/90",
          isTitleSticky && isElectronWindows && "-top-5",
        )}
      >
        <MotionButtonBase
          onClick={() => {
            navigate(prevLocation)
          }}
          className="no-drag-region hover:text-accent inline-flex items-center gap-1 duration-200"
        >
          <i className="i-mingcute-left-line" />
          <span className="text-sm font-medium">{t("words.back", { ns: "common" })}</span>
        </MotionButtonBase>
        <div>
          <div className="font-bold opacity-0 duration-200 group-[.group]:opacity-100">{title}</div>
        </div>
        <div />
      </div>

      <ScrollArea.ScrollArea
        mask={false}
        flex
        ref={setRef}
        rootClassName="w-full"
        viewportClassName="pb-10 pt-28 [&>div]:items-center"
      >
        <Outlet />
      </ScrollArea.ScrollArea>

      <FABContainer>
        <BackToTopFAB show={isTitleSticky} scrollRef={scrollRef} />
      </FABContainer>
    </div>
  )
}

const BackToTopFAB = ({ show, scrollRef }: { show: boolean; scrollRef: any }) => {
  return (
    <FABPortable
      onClick={() => {
        springScrollTo(0, scrollRef)
      }}
      show={show}
    >
      <i className="i-mingcute-arow-to-up-line" />
    </FABPortable>
  )
}
