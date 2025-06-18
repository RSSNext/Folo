import { cn } from "@follow/utils/utils"
import { easeOut, m, useScroll, useTransform } from "motion/react"
import { Outlet } from "react-router"

import { HeaderTopReturnBackButton } from "~/components/mobile/button"

import { useSubViewTitleValue } from "./hooks"

export const SubviewLayout = () => {
  const title = useSubViewTitleValue()

  const scrollYProgress = useScroll()

  const opacity = useTransform(scrollYProgress.scrollY, [0, 120], [0, 1], { ease: easeOut })
  const borderOpacity = useTransform(scrollYProgress.scrollY, [50, 120], [0, 0.5], {
    ease: easeOut,
  })

  return (
    <div className="flex h-svh flex-col">
      <HeaderTopReturnBackButton className="fixed z-[11] m-3" />

      <m.div
        className={cn(
          "sticky inset-x-0 top-0 z-10 p-4",
          "grid grid-cols-[1fr_auto_1fr] items-center gap-4",
          "bg-theme-background",
          "border-b",
        )}
        style={{
          opacity,
          borderColor: useTransform(borderOpacity, (value) => `hsl(var(--border) / ${value})`),
        }}
      >
        <div />
        <div>
          <div className="font-bold">{title}</div>
        </div>
        <div />
      </m.div>
      <div className="h-0 flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}
