import { noop } from "foxact/noop"
import type { Dispatch, SetStateAction } from "react"
import { createContext, use, useCallback } from "react"
import { createContext as createContextSelector, useContextSelector } from "use-context-selector"

export const MasonryItemWidthContext = createContext(0)

export const useMasonryItemWidth = () => use(MasonryItemWidthContext)

export const MasonryItemsAspectRatioContext = createContextSelector({} as Record<string, number>)

export const MasonryIntersectionContext = createContext<IntersectionObserver>(null!)

export const useMasonryItemRatio = (url: string) =>
  useContextSelector(MasonryItemsAspectRatioContext, (ctx) => ctx[url])

export const MasonryItemsAspectRatioSetterContext =
  createContext<Dispatch<SetStateAction<Record<string, number>>>>(noop)

export const useSetStableMasonryItemRatio = () => {
  const ctx = use(MasonryItemsAspectRatioSetterContext)
  return useCallback(
    (url: string, ratio: number) => {
      ctx((prev: Record<string, number>) => {
        // Skip if the ratio is already set, make it stable
        if (prev[url]) return prev

        return { ...prev, [url]: ratio }
      })
    },
    [ctx],
  )
}
