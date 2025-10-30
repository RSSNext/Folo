/* eslint-disable @eslint-react/no-children-to-array */
/* eslint-disable @eslint-react/no-children-map */

import { cn } from "@follow/utils/utils"
import type { FC, PropsWithChildren, ReactNode } from "react"
import { cloneElement, createContext, use, useEffect, useRef } from "react"
import * as React from "react"
import { titleCase } from "title-case"

import { SettingActionItem, SettingDescription, SettingSwitch } from "./control"

export const SettingSectionHighlightIdContext = createContext<string | null>(null)

export const SettingSectionTitle: FC<{
  title: string | ReactNode
  className?: string
  margin?: "compact" | "normal"
  sectionId?: string
}> = ({ title, margin, className, sectionId }) => {
  const highlightedSectionId = use(SettingSectionHighlightIdContext)
  const elementRef = useRef<HTMLDivElement | null>(null)

  const isHighlighted = !!sectionId && highlightedSectionId === sectionId && !!elementRef.current

  useEffect(() => {
    if (!isHighlighted) {
      return
    }

    let rollingAnimation: Animation | null = null

    const timer = setTimeout(() => {
      const highlightedElement = elementRef.current?.querySelector(
        "[data-highlighted-element]",
      ) as HTMLElement
      if (!highlightedElement) {
        clearTimeout(timer)
        return
      }
      const keyframeEffect = new KeyframeEffect(
        highlightedElement,
        [
          {
            backgroundColor: "color-mix(in srgb, hsl(var(--fo-a)) 33%, hsl(var(--background)) 67%)",
          },
          { backgroundColor: "transparent" },
        ],
        {
          duration: 1000,
          easing: "ease-in-out",
        },
      )
      rollingAnimation = new Animation(keyframeEffect, document.timeline)
      rollingAnimation.play()
    }, 500)
    return () => {
      rollingAnimation?.cancel()
      clearTimeout(timer)
    }
  }, [isHighlighted])
  return (
    <div
      ref={elementRef}
      data-setting-section={sectionId}
      data-highlighted={isHighlighted ? "true" : undefined}
      className={cn(
        "relative shrink-0 text-headline font-bold text-text/80 first:mt-0",
        margin === "compact" ? "mb-2 mt-8" : "mb-4 mt-10",
        className,
      )}
    >
      {isHighlighted && <div className="absolute -inset-4 rounded-lg" data-highlighted-element />}
      {typeof title === "string" ? titleCase(title) : title}
    </div>
  )
}

export const SettingItemGroup: FC<PropsWithChildren> = ({ children }) => {
  const childrenArray = React.Children.toArray(children)
  return React.Children.map(children, (child, index) => {
    if (typeof child !== "object") return child

    if (child === null) return child

    const compType = (child as React.ReactElement).type
    if (compType === SettingDescription) {
      const prevIndex = index - 1
      const prevChild = childrenArray[prevIndex]
      const prevType = getChildType(prevChild)

      switch (prevType) {
        case SettingSwitch: {
          return cloneElement(child as React.ReactElement, {
            // @ts-expect-error
            className: "!-mt-2",
          })
        }
        case SettingActionItem: {
          return cloneElement(child as React.ReactElement, {
            // @ts-expect-error
            className: "!-mt-2",
          })
        }
        default: {
          return child
        }
      }
    }

    return child
  })
}

const getChildType = (child: ReactNode) => {
  if (typeof child !== "object") return null

  if (child === null) return null

  return (child as React.ReactElement).type
}
