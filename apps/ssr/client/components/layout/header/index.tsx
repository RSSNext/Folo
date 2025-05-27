import { siteConfig } from "@client/configs"
import { openInFollowApp } from "@client/lib/helper"
import { Folo } from "@follow/components/icons/folo.js"
import { Logo } from "@follow/components/icons/logo.jsx"
import { SocialMediaLinks } from "@follow/constants"
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
          <div className="flex flex-wrap items-center gap-6 text-2xl">
            {SocialMediaLinks.map((link) => (
              <a
                href={link.url}
                key={link.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center"
              >
                <i className={link.iconClassName} />
              </a>
            ))}
          </div>
        </nav>
      </Container>
    </HeaderWrapper>
  )
}
