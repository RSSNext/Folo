import { Folo } from "@follow/components/icons/folo.js"
import { Logo } from "@follow/components/icons/logo.jsx"
import { SocialMediaLinks } from "@follow/constants"
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
          "mx-4 mt-4 transition-all duration-300 ease-out",
          isCompact ? "mt-2" : "mt-4",
          isHeaderElevated ? "mx-0 md:mx-4" : "px-4 sm:px-6 lg:px-8",
        )}
      >
        <m.div
          className={cn(
            "rounded-xl border border-transparent px-4 transition-all duration-300 ease-out",
            "relative flex items-center",
            isCompact ? "py-2" : "py-3",
            isHeaderElevated && [
              "border-border/50 bg-background/80 px-4 shadow-lg backdrop-blur-xl md:px-0",
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

          {/* Enhanced Social Links Section */}
          <div className="flex shrink-0 items-center">
            <div
              className={cn(
                "flex items-center gap-2 transition-all duration-300",
                isCompact ? "gap-1 text-xl" : "gap-2 text-2xl",
              )}
            >
              {SocialMediaLinks.map((link) => (
                <m.a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ scale: 1.1, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "group relative flex items-center justify-center rounded-lg",
                    "text-text-secondary hover:text-text",
                    "hover:bg-fill/40 active:bg-fill/60",
                    isCompact ? "size-8" : "size-10",
                  )}
                >
                  <i
                    className={cn(
                      link.iconClassName,
                      "transition-transform duration-200 group-hover:scale-110",
                    )}
                  />

                  {/* Subtle hover effect */}
                  <div className="from-blue/10 to-purple/10 absolute inset-0 rounded-lg bg-gradient-to-r opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                </m.a>
              ))}
            </div>
          </div>
        </nav>
      </Container>
    </HeaderWrapper>
  )
}
