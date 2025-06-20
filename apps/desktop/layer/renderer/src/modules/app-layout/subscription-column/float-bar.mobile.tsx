import { Logo } from "@follow/components/icons/logo.js"
import { MotionButtonBase } from "@follow/components/ui/button/index.js"
import { DividerVertical } from "@follow/components/ui/divider/Divider.js"
import { views } from "@follow/constants"
import { useEntry } from "@follow/store/entry/hooks"
import { useFeedById } from "@follow/store/feed/hooks"
import { feedIconSelector } from "@follow/store/feed/selectors"
import { useViewWithSubscription } from "@follow/store/subscription/hooks"
import { stopPropagation } from "@follow/utils/dom"
import { clsx } from "@follow/utils/utils"
import { m, useAnimationControls } from "motion/react"
import { useCallback, useEffect, useRef, useState } from "react"

import { useAudioPlayerAtomSelector } from "~/atoms/player"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"

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
        y: `calc(100% + 40px + ${safeAreaBottom})`,
        transition: { type: "tween", duration: 0.1 },
      })
    } else {
      animateController.start({
        y: 0,
      })
    }
  }, [isScrollDown, animateController])

  return (
    <div
      className={clsx(
        "pb-safe-offset-2 pointer-events-none absolute inset-x-0 bottom-0 flex h-40 items-end",
        className,
      )}
    >
      <m.div
        className={clsx(
          "bg-background/90 mx-3 inline-flex h-12 w-full min-w-0 items-center justify-between rounded-2xl border border-neutral-200/60 px-4 backdrop-blur-md dark:border-neutral-800/60",
          "shadow-lg shadow-zinc-200/40 dark:shadow-zinc-900/40",
          "pointer-events-auto transition-all duration-200",
        )}
        transition={{ type: "spring", damping: 20 }}
        animate={animateController}
      >
        <div className="flex items-center gap-3">
          <PlayerIcon isScrollDown={isScrollDown} onLogoClick={onLogoClick} />
          <DividerVertical className="h-5 shrink-0 opacity-60" />
        </div>
        <ViewTabs onViewChange={onViewChange} />
        <div className="flex items-center gap-3">
          <DividerVertical className="h-5 shrink-0 opacity-60" />
          <ProfileButton />
        </div>
      </m.div>
    </div>
  )
}

const ViewTabs = ({ onViewChange }: { onViewChange?: (view: number) => void }) => {
  const viewsWithSubscription = useViewWithSubscription()
  const view = useRouteParamsSelector((s) => s.view)
  const navigate = useNavigateEntry()

  return (
    <div
      className="text-text-secondary scrollbar-none flex shrink items-center justify-center gap-6 overflow-x-auto overflow-y-hidden text-xl"
      onClick={stopPropagation}
    >
      {views
        .filter((item) => viewsWithSubscription.includes(item.view))
        .map((item) => (
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
