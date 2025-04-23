import { Logo } from "@follow/components/icons/logo.js"
import { MotionButtonBase } from "@follow/components/ui/button/index.js"
import { DividerVertical } from "@follow/components/ui/divider/Divider.js"
import { views } from "@follow/constants"
import { stopPropagation } from "@follow/utils/dom"
import { clsx } from "@follow/utils/utils"
import { m, useAnimationControls } from "motion/react"
import { useCallback, useEffect, useRef, useState } from "react"

import { useAudioPlayerAtomSelector } from "~/atoms/player"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { useEntry } from "~/store/entry"
import { useFeedById } from "~/store/feed"
import { feedIconSelector } from "~/store/feed/selector"

import { ProfileButton } from "../../user/ProfileButton"
import { PodcastButton } from "./components/PodcastButton"

export const MobileFloatBar = ({
  scrollContainer,
  className,
  onLogoClick,
  onViewChange,
}: {
  scrollContainer: Nullable<HTMLDivElement>
  className?: string
  onLogoClick?: () => void
  onViewChange?: (view: number) => void
}) => {
  const [isScrollDown, setIsScrollDown] = useState(false)
  const prevScrollY = useRef(0)
  useEffect(() => {
    if (!scrollContainer) return

    const handler = () => {
      const currentY = scrollContainer.scrollTop

      if (currentY < 30) return

      const isScrollEnd =
        scrollContainer.scrollHeight - currentY - scrollContainer.clientHeight < 10

      if (isScrollEnd) {
        setIsScrollDown(true)
        return
      }

      setIsScrollDown(currentY > prevScrollY.current)
      prevScrollY.current = currentY
    }
    scrollContainer.addEventListener("scroll", handler)
    return () => scrollContainer.removeEventListener("scroll", handler)
  }, [scrollContainer])

  const animateController = useAnimationControls()

  useEffect(() => {
    if (isScrollDown) {
      const computedStyle = getComputedStyle(document.documentElement)
      const safeAreaBottom = computedStyle.getPropertyValue("--sab")
      animateController.start({
        translateY: `calc(100% + 40px + ${safeAreaBottom})`,
        transition: { type: "tween", duration: 0.1 },
      })
    } else {
      animateController.start({
        translateY: 0,
      })
    }
  }, [isScrollDown, animateController])

  return (
    <div
      className={clsx(
        "pb-safe-offset-6 pointer-events-none absolute inset-x-0 bottom-0 flex h-36 items-end",
        className,
      )}
    >
      <m.div
        className={clsx(
          "bg-background mx-1 inline-flex h-10 w-full min-w-0 items-center rounded-full border border-neutral-200 pl-4 pr-2 shadow-sm shadow-zinc-100 dark:border-neutral-800",
          "[box-shadow:0px_8px_30px_rgba(122,122,122,0.2)] dark:[box-shadow:0px_8px_30px_rgba(122,122,122,0.2)]",
          "pointer-events-auto",
        )}
        transition={{ type: "spring" }}
        animate={animateController}
      >
        <PlayerIcon isScrollDown={isScrollDown} onLogoClick={onLogoClick} />
        <DividerVertical className="h-3/4 shrink-0" />
        <ViewTabs onViewChange={onViewChange} />
        <DividerVertical className="h-3/4 shrink-0" />
        <ProfileButton />
      </m.div>
    </div>
  )
}

const ViewTabs = ({ onViewChange }: { onViewChange?: (view: number) => void }) => {
  const view = useRouteParamsSelector((s) => s.view)
  const navigate = useNavigateEntry()

  return (
    <div
      className="text-theme-vibrancyFg flex w-full shrink items-center justify-between gap-4 overflow-x-auto overflow-y-hidden text-xl"
      onClick={stopPropagation}
    >
      {views.map((item) => (
        <MotionButtonBase
          className={clsx(
            "center flex transition-colors duration-200",
            view === item.view && item.className,
          )}
          key={item.name}
          onClick={() => {
            navigate({ view: item.view })
            onViewChange?.(item.view)
          }}
        >
          <div className="relative flex flex-col items-center">{item.icon}</div>
        </MotionButtonBase>
      ))}
    </div>
  )
}

const PlayerIcon = ({ onLogoClick }: { isScrollDown: boolean; onLogoClick?: () => void }) => {
  const { show, entryId } = useAudioPlayerAtomSelector(
    useCallback((state) => ({ entryId: state.entryId, show: state.show }), []),
  )
  const feedId = useEntry(entryId, (s) => s.feedId)
  const feed = useFeedById(feedId, feedIconSelector)
  if (!feed || !show) {
    return (
      <MotionButtonBase onClick={onLogoClick}>
        <Logo className="size-5 shrink-0" />
      </MotionButtonBase>
    )
  }

  return <PodcastButton feed={feed} />
}
