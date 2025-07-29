/* eslint-disable react-refresh/only-export-components */
import { useScrollViewElement } from "@follow/components/ui/scroll-area/hooks.js"
import { cn } from "@follow/utils/utils"
import { createContextState } from "foxact/create-context-state"
import { useIsomorphicLayoutEffect } from "foxact/use-isomorphic-layout-effect"
import type { PrimitiveAtom } from "jotai"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { createContext, memo, use, useCallback, useEffect, useRef } from "react"

import { ProviderComposer } from "~/components/common/ProviderComposer"
import { jotaiStore } from "~/lib/jotai"

const [WrappedElementProviderInternal, useWrappedElement, useSetWrappedElement] =
  createContextState<HTMLDivElement | null>(undefined as any)

const [ElementSizeProviderInternal, useWrappedElementSize, useSetWrappedElementSize] =
  createContextState({
    h: 0,
    w: 0,
  })

const ElementPositionProviderInternal = createContext<PrimitiveAtom<{ x: number; y: number }>>(
  null!,
)

const [IsEndOfElementProviderInternal, useIsEoFWrappedElement, useSetIsEOfElement] =
  createContextState<boolean>(false)

const [IsStartOfElementProviderInternal, useIsSoFWrappedElement, useSetIsSOfElement] =
  createContextState<boolean>(false)

const Providers = [
  <WrappedElementProviderInternal key="ArticleElementProviderInternal" />,
  <ElementSizeProviderInternal key="ElementSizeProviderInternal" />,
  <ElementPositionProviderInternal
    key="ElementPositionProviderInternal"
    value={atom({
      x: 0,
      y: 0,
    })}
  />,
  <IsEndOfElementProviderInternal key="IsEndOfElementProviderInternal" />,
  <IsStartOfElementProviderInternal key="IsStartOfElementProviderInternal" />,
]

interface WrappedElementProviderProps {
  boundingDetection?: boolean
  as?: keyof React.JSX.IntrinsicElements
}

export const WrappedElementProvider: Component<WrappedElementProviderProps> = ({
  children,
  className,
  ...props
}) => (
  <ProviderComposer contexts={Providers}>
    <ArticleElementResizeObserver />
    <Content {...props} className={className}>
      {children}
    </Content>
  </ProviderComposer>
)
const ArticleElementResizeObserver = () => {
  const setSize = useSetWrappedElementSize()

  const setPosition = useSetAtom(use(ElementPositionProviderInternal))
  const $element = useWrappedElement()
  useIsomorphicLayoutEffect(() => {
    if (!$element) return
    const { height, width, x, y } = $element.getBoundingClientRect()
    setSize({ h: height, w: width })

    setPosition({ x, y })

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]!
      const { height, width } = entry.contentRect
      const { x, y } = entry.target.getBoundingClientRect()

      setSize({ h: height, w: width })
      setPosition({ x, y })
    })
    observer.observe($element)
    return () => {
      observer.unobserve($element)
      observer.disconnect()
    }
  }, [$element, setPosition])

  return null
}

const Content: Component<WrappedElementProviderProps> = memo(
  ({ children, className, boundingDetection, as = "div" }) => {
    const setElement = useSetWrappedElement()

    const As = as as any
    return (
      <As className={cn("relative", className)} ref={setElement}>
        {boundingDetection && <BoundingDetection bounding="start" />}
        {children}
        {boundingDetection && <BoundingDetection bounding="end" />}
      </As>
    )
  },
)

Content.displayName = "ArticleElementProviderContent"

const BoundingDetection: Component<{
  bounding: "start" | "end"
}> = ({ bounding }) => {
  const endSetter = useSetIsEOfElement()
  const startSetter = useSetIsSOfElement()
  const ref = useRef<HTMLDivElement>(null)
  const $scrollArea = useScrollViewElement()
  useEffect(() => {
    if (!ref.current) return
    const $el = ref.current
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]!

        if (bounding === "start") startSetter(entry.isIntersecting)
        else endSetter(entry.isIntersecting)
      },
      {
        rootMargin: "0px 0px 0px 0px",
        root: $scrollArea,
      },
    )

    observer.observe($el)
    return () => {
      observer.unobserve($el)
      observer.disconnect()
    }
  }, [$scrollArea, bounding, endSetter, startSetter])

  return <div ref={ref} />
}

export const useWrappedElementPosition = () => useAtomValue(use(ElementPositionProviderInternal))

export const useGetWrappedElementPosition = () => {
  const atom = use(ElementPositionProviderInternal)
  return useCallback(() => jotaiStore.get(atom), [atom])
}

export {
  useIsEoFWrappedElement,
  useIsSoFWrappedElement,
  useSetWrappedElement,
  useWrappedElement,
  useWrappedElementSize,
}
