import * as React from "react"
import {
  cloneElement,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react"
import { useEventListener } from "usehooks-ts"

import {
  FocusableContainerRefContext,
  FocusableContext,
  FocusActionsContext,
  FocusTargetRefContext,
} from "./context"
import { useSetGlobalFocusableScope } from "./hooks"
import { highlightElement } from "./utils"

export interface FocusableProps {
  scope?: string
  asChild?: boolean
}
export const Focusable: Component<
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> & FocusableProps
> = ({ ref, scope, asChild, ...props }) => {
  const { onBlur, onFocus, ...rest } = props

  const [isFocusWithIn, setIsFocusWithIn] = useState(false)
  const focusTargetRef = useRef<HTMLElement | undefined>(void 0)

  const containerRef = useRef<HTMLDivElement>(null)
  useImperativeHandle(ref, () => containerRef.current!)

  const highlightBoundary = useCallback(() => {
    const { activeElement } = document
    if (!containerRef.current?.contains(activeElement as Node)) {
      return
    }
    const element = containerRef.current
    if (!element) return

    highlightElement(element)
  }, [])

  const setGlobalFocusableScope = useSetGlobalFocusableScope()
  useEffect(() => {
    if (!scope) {
      return
    }

    const $container = containerRef.current
    if (!$container) return

    const focusIn = () => {
      setGlobalFocusableScope(scope, "append")
    }
    $container.addEventListener("focusin", focusIn)
    const focusOut = () => {
      if ($container.contains(document.activeElement as Node)) {
        return
      }
      setGlobalFocusableScope(scope, "remove")
    }
    $container.addEventListener("focusout", focusOut)

    return () => {
      $container.removeEventListener("focus", focusIn)
      $container.removeEventListener("blur", focusOut)
      $container.removeEventListener("focusin", focusIn)
      $container.removeEventListener("focusout", focusOut)
    }
  }, [scope, setGlobalFocusableScope])

  // highlight boundary
  useEventListener("focusin", (e) => {
    if (containerRef.current?.contains(e.target as Node)) {
      setIsFocusWithIn(true)
      focusTargetRef.current = e.target as HTMLElement
      if (import.meta.env.DEV) {
        highlightElement(containerRef.current!, "14, 165, 233")
        console.info("[Focusable] focusin", containerRef.current)
      }
    } else {
      setIsFocusWithIn(false)
      focusTargetRef.current = undefined
    }
  })
  useEffect(() => {
    if (!containerRef.current) return
    setIsFocusWithIn(containerRef.current.contains(document.activeElement as Node))
  }, [containerRef])

  if (asChild) {
    assertChildren(rest.children)
  }
  return (
    <FocusableContext value={isFocusWithIn}>
      <FocusTargetRefContext value={focusTargetRef}>
        <FocusActionsContext value={useMemo(() => ({ highlightBoundary }), [highlightBoundary])}>
          <FocusableContainerRefContext value={containerRef}>
            {asChild ? (
              cloneElement(
                rest.children as React.ReactElement<React.HTMLAttributes<HTMLDivElement>>,
                {
                  tabIndex: -1,
                  role: "region",
                  ...rest,
                },
              )
            ) : (
              <div tabIndex={-1} role="region" ref={containerRef} {...rest} />
            )}
          </FocusableContainerRefContext>
        </FocusActionsContext>
      </FocusTargetRefContext>
    </FocusableContext>
  )
}

const assertChildren = (children: React.ReactNode) => {
  if (!children) {
    throw new Error("[Focusable] `asChild` must have a child")
  }
  const child = React.Children.count(children)
  if (child !== 1) {
    throw new Error("[Focusable] `asChild` must have exactly one child")
  }
}
