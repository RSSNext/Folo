import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import { useEventListener } from "usehooks-ts"

import {
  FocusableContainerRefContext,
  FocusableContext,
  FocusActionsContext,
  FocusTargetRefContext,
} from "./context"
import { highlightElement } from "./utils"

export const Focusable: Component<
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>
> = ({ ref, ...props }) => {
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
