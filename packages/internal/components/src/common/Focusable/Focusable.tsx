import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
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
}
export const Focusable: Component<
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> & FocusableProps
> = ({ ref, scope, ...props }) => {
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
      setGlobalFocusableScope(scope, "remove")
    }
    $container.addEventListener("focusout", focusOut)

    return () => {
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

  return (
    <FocusableContext value={isFocusWithIn}>
      <FocusTargetRefContext value={focusTargetRef}>
        <FocusActionsContext value={useMemo(() => ({ highlightBoundary }), [highlightBoundary])}>
          <FocusableContainerRefContext value={containerRef}>
            <div tabIndex={-1} role="region" ref={containerRef} {...rest} />
          </FocusableContainerRefContext>
        </FocusActionsContext>
      </FocusTargetRefContext>
    </FocusableContext>
  )
}
