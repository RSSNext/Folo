import { cn } from "@follow/utils/utils"
import { createContextState } from "foxact/create-context-state"
import { useIsomorphicLayoutEffect } from "foxact/use-isomorphic-layout-effect"
import type * as React from "react"
import { memo } from "react"

import { ProviderComposer } from "./ProviderComposer"

const [WrappedElementProviderInternal, useWrappedElement, useSetWrappedElement] =
  createContextState<HTMLDivElement | null>(undefined as any)

const [ElementSizeProviderInternal, useWrappedElementSize, useSetWrappedElementSize] =
  createContextState({
    h: 0,
    w: 0,
  })

const [ElementPositionProviderInternal, useWrappedElementPosition, useSetElementPosition] =
  createContextState({
    x: 0,
    y: 0,
  })

const Providers = [
  <WrappedElementProviderInternal key="ArticleElementProviderInternal" />,
  <ElementSizeProviderInternal key="ElementSizeProviderInternal" />,
  <ElementPositionProviderInternal key="ElementPositionProviderInternal" />,
]

interface WrappedElementProviderProps {
  as?: keyof React.JSX.IntrinsicElements
}

export const WrappedElementProvider: Component<WrappedElementProviderProps> = ({
  children,
  className,
  ...props
}) => (
  <ProviderComposer contexts={Providers}>
    <ElementResizeObserver />
    <Content {...props} className={className}>
      {children}
    </Content>
  </ProviderComposer>
)
const ElementResizeObserver = () => {
  const setSize = useSetWrappedElementSize()
  const setPos = useSetElementPosition()
  const $element = useWrappedElement()
  useIsomorphicLayoutEffect(() => {
    if (!$element) return
    const { height, width, left, top } = $element.getBoundingClientRect()
    setSize({ h: height, w: width })

    const pageX = window.scrollX + left
    const pageY = window.scrollY + top
    setPos({ x: pageX, y: pageY })

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]

      if (!entry) return

      const { height, width } = entry.contentRect
      const { left, top } = $element.getBoundingClientRect()
      const pageX = window.scrollX + left
      const pageY = window.scrollY + top

      setSize((size) => {
        if (size.h === height && size.w === width) return size
        return { h: height, w: width }
      })
      setPos((pos) => {
        if (pos.x === pageX && pos.y === pageY) return pos
        return { x: pageX, y: pageY }
      })
    })
    observer.observe($element)
    return () => {
      observer.unobserve($element)
      observer.disconnect()
    }
  }, [$element])

  return null
}

const Content: Component<WrappedElementProviderProps> = memo(
  ({ children, className, as = "div" }) => {
    const setElement = useSetWrappedElement()

    const As = as as any
    return (
      <As className={cn("relative", className)} ref={setElement}>
        {children}
      </As>
    )
  },
)

Content.displayName = "ArticleElementProviderContent"

export { useSetWrappedElement, useWrappedElement, useWrappedElementPosition, useWrappedElementSize }
