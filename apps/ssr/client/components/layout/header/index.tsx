import { siteConfig } from "@client/configs"
import { openInFollowApp } from "@client/lib/helper"
import { Folo } from "@follow/components/icons/folo.js"
import { Logo } from "@follow/components/icons/logo.jsx"
import { Button } from "@follow/components/ui/button/index.jsx"
import { Kbd } from "@follow/components/ui/kbd/Kbd.jsx"
import { cn } from "@follow/utils/utils"
import type { MotionValue } from "motion/react"
import { useMotionValueEvent, useScroll } from "motion/react"
import * as React from "react"
import { useState } from "react"
import { useHotkeys } from "react-hotkeys-hook"

const useMotionValueToState = (value: MotionValue<number>) => {
  const [state, setState] = useState(value.get())
  useMotionValueEvent(value, "change", (v) => setState(v))
  return state
}

function Container({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[var(--container-max-width)] px-4 sm:px-6 lg:px-8",
        className,
      )}
      {...props}
    />
  )
}

const HeaderWrapper: Component = (props) => {
  const { scrollY } = useScroll()
  const scrollYState = useMotionValueToState(scrollY)
  const showOverlay = scrollYState > 100

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 flex h-[80px] w-full items-center px-4 duration-200 lg:px-10",
        showOverlay && "h-[60px]",
      )}
    >
      <div
        className={cn(
          "absolute inset-0 transform-gpu [-webkit-backdrop-filter:saturate(180%)_blur(20px)] [backdrop-filter:saturate(180%)_blur(20px)] [backface-visibility:hidden]",
          "bg-[var(--bg-opacity)] duration-200 [border-bottom:1px_solid_rgb(187_187_187_/_20%)]",
        )}
        style={{
          opacity: showOverlay ? 1 : 0,
        }}
      />

      {props.children}
    </header>
  )
}
export const Header = () => {
  const handleToApp = () => {
    openInFollowApp({
      deeplink: "",
      fallback: () => {
        return siteConfig.appUrl
      },
      fallbackUrl: siteConfig.appUrl,
    })
  }
  useHotkeys("l", handleToApp)

  return (
    <HeaderWrapper>
      <Container>
        <nav className="relative flex justify-between">
          <div className="flex items-center md:gap-x-12">
            <a className="flex items-center gap-4" href="/">
              <Logo className="h-8 w-auto" />
              {/* <p className="font-default text-xl font-semibold">{APP_NAME}</p> */}
              <Folo className="size-10" />
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Button
              className="flex size-9 rounded-full border-neutral-300 bg-transparent hover:border-zinc-400 md:w-auto md:px-2 dark:border-neutral-700 dark:hover:border-zinc-600"
              variant="outline"
            >
              <a
                href={siteConfig.repoUrl}
                className="flex items-center gap-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="i-simple-icons-github size-4" />
                <span className="hidden md:inline">Star on GitHub</span>
              </a>
            </Button>
            <Button
              buttonClassName="hidden lg:block cursor-pointer !text-accent-content"
              onClick={handleToApp}
            >
              Open app
              <Kbd className="!leading-0 !dark:bg-zinc-200 kbd-xs ml-2 size-5 scale-[0.85] rounded-sm !border-transparent !bg-zinc-50 !font-mono text-black">
                L
              </Kbd>
            </Button>
          </div>
        </nav>
      </Container>
    </HeaderWrapper>
  )
}
