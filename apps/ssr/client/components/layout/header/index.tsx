import { Folo } from "@follow/components/icons/folo.js"
import { Logo } from "@follow/components/icons/logo.jsx"
import { cn } from "@follow/utils/utils"
import type { MotionValue } from "motion/react"
import { m, useMotionValueEvent, useScroll } from "motion/react"
import * as React from "react"
import { useState } from "react"

const useMotionValueToState = (value: MotionValue<number>) => {
  const [state, setState] = useState(value.get())
  useMotionValueEvent(value, "change", (v) => setState(v))
  return state
}

function Container({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-[var(--container-max-width)]", className)}
      {...props}
    />
  )
}

const HeaderWrapper: Component = (props) => {
  const { scrollY } = useScroll()
  const scrollYState = useMotionValueToState(scrollY)

  // Enhanced scroll state management
  const isHeaderElevated = scrollYState > 20
  const isCompact = scrollYState > 60

  return (
    <header className={"fixed inset-x-0 top-0 z-50 transition-all duration-300 ease-out"}>
      <div
        className={cn(
          "mx-4 mt-4 max-w-5xl transition-all duration-300 ease-out lg:mx-auto",
          isCompact ? "mt-2" : "mt-4",
        )}
      >
        <m.div
          className={cn(
            "rounded-full border border-transparent px-6 transition-all duration-300 ease-out",
            "relative flex items-center",
            isCompact ? "py-2 pl-5 pr-2" : "py-3",
            isHeaderElevated && [
              "border-border/50 bg-background/80 shadow-sm backdrop-blur-xl",
              "supports-[backdrop-filter]:bg-background/60",
            ],
          )}
        >
          {props.children}
        </m.div>
      </div>
    </header>
  )
}

export const Header = () => {
  const { scrollY } = useScroll()
  const scrollYState = useMotionValueToState(scrollY)
  const isCompact = scrollYState > 60

  return (
    <HeaderWrapper>
      <Container className="w-full">
        <nav className="relative flex w-full items-center justify-between">
          {/* Enhanced Logo Section */}
          <m.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex shrink-0 items-center"
          >
            <a
              className={cn(
                "group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-all duration-200",
                "hover:bg-fill/30",
              )}
              href="/"
            >
              <Logo
                className={cn(
                  "transition-all duration-300",
                  isCompact ? "h-6 w-auto" : "h-8 w-auto",
                )}
              />
              <Folo
                className={cn("transition-all duration-300", isCompact ? "size-7" : "size-10")}
              />
            </a>
          </m.div>

          {/* Right actions */}
          <div className="flex shrink-0 items-center gap-2">
            {/* GitHub stars pill */}
            <m.a
              href="https://github.com/RSSNext/Folo"
              target="_blank"
              rel="noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 font-medium",
                "bg-fill/60 text-text hover:bg-fill/80 text-sm",
                isCompact ? "h-8" : "h-10",
              )}
            >
              <i className="i-mgc-github-cute-fi text-base" />
              GitHub
            </m.a>

            {/* Sign in pill */}
            <m.a
              href="/login"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "inline-flex items-center justify-center rounded-full px-4 font-medium",
                "bg-white text-sm text-black shadow-sm hover:shadow",
                "dark:bg-zinc-50 dark:text-zinc-900",
                isCompact ? "h-8" : "h-10",
              )}
            >
              Sign in
            </m.a>
          </div>
        </nav>
      </Container>
    </HeaderWrapper>
  )
}
