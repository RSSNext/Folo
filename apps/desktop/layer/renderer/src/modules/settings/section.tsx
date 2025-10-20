/* eslint-disable @eslint-react/no-children-to-array */
/* eslint-disable @eslint-react/no-children-map */

import { cn } from "@follow/utils/utils"
import type { FC, PropsWithChildren, ReactNode } from "react"
import { cloneElement, createContext, use, useEffect, useRef } from "react"
import * as React from "react"
import { titleCase } from "title-case"

import { SettingActionItem, SettingDescription, SettingSwitch } from "./control"

type SettingSectionHighlightContextValue = {
  highlightedSectionId?: string
  registerSection: (sectionId: string, element: HTMLElement | null) => void
}

export const SettingSectionHighlightContext =
  createContext<SettingSectionHighlightContextValue | null>(null)

export const SettingSectionTitle: FC<{
  title: string | ReactNode
  className?: string
  margin?: "compact" | "normal"
  sectionId?: string
}> = ({ title, margin, className, sectionId }) => {
  const highlightCtx = use(SettingSectionHighlightContext)
  const elementRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!sectionId || !highlightCtx) return
    highlightCtx.registerSection(sectionId, elementRef.current)
    return () => {
      highlightCtx.registerSection(sectionId, null)
    }
  }, [highlightCtx, sectionId])

  const isHighlighted =
    !!sectionId && highlightCtx?.highlightedSectionId === sectionId && !!elementRef.current

  return (
    <div
      ref={elementRef}
      data-setting-section={sectionId}
      data-highlighted={isHighlighted ? "true" : undefined}
      className={cn(
        "text-text text-headline shrink-0 font-bold opacity-50 transition-colors duration-300 first:mt-0",
        margin === "compact" ? "mb-2 mt-8" : "mb-4 mt-10",
        isHighlighted && "border-folo -ml-3 rounded-lg border px-3 py-1.5 opacity-100",
        className,
      )}
    >
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
