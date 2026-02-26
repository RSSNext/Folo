// @copy https://github.com/pmndrs/react-use-measure/blob/master/src/web/index.ts

import { debounce } from 'es-toolkit/compat'
import { useEffect, useMemo, useRef, useState } from 'react'

const createDebounce = debounce
declare type ResizeObserverCallback = (
  entries: any[],
  observer: ResizeObserver,
) => void
declare class ResizeObserver {
  constructor(callback: ResizeObserverCallback)
  observe(target: Element, options?: any): void
  unobserve(target: Element): void
  disconnect(): void
  static toString(): string
}

export interface RectReadOnly {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly top: number
  readonly right: number
  readonly bottom: number
  readonly left: number
  [key: string]: number
}

type HTMLOrSVGElement = HTMLElement | SVGElement

type Result = [
  (element: HTMLOrSVGElement | null) => void,
  RectReadOnly,
  () => void,
]

type State = {
  element: HTMLOrSVGElement | null
  scrollContainers: HTMLOrSVGElement[] | null
  resizeObserver: ResizeObserver | null
  lastBounds: RectReadOnly
}

export type Options = {
  debounce?: number | { scroll: number; resize: number }
  scroll?: boolean
  offsetSize?: boolean
}

const defaultOptions: Options = {
  debounce: 0,
  scroll: false,
  offsetSize: false,
}
export function useMeasure({
  debounce,
  scroll,
  offsetSize,
}: Options = defaultOptions): Result {
  const [bounds, set] = useState<RectReadOnly>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    bottom: 0,
    right: 0,
    x: 0,
    y: 0,
  })

  // keep all state in a ref
  const state = useRef<State>({
    element: null,
    scrollContainers: null,
    resizeObserver: null,
    lastBounds: bounds,
  })

  // set actual debounce values early, so effects know if they should react accordingly
  const scrollDebounce = debounce
    ? typeof debounce === 'number'
      ? debounce
      : debounce.scroll
    : null
  const resizeDebounce = debounce
    ? typeof debounce === 'number'
      ? debounce
      : debounce.resize
    : null

  // make sure to update state only as long as the component is truly mounted
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => void (mounted.current = false)
  })

  // memoize handlers, so event-listeners know when they should update
  const [forceRefresh, resizeChange, scrollChange] = useMemo(() => {
    const callback = () => {
      if (!state.current.element) return
      const { left, top, width, height, bottom, right, x, y } =
        state.current.element.getBoundingClientRect() as unknown as RectReadOnly

      const size = {
        left,
        top,
        width,
        height,
        bottom,
        right,
        x,
        y,
      }

      if (state.current.element instanceof HTMLElement && offsetSize) {
        size.height = state.current.element.offsetHeight
        size.width = state.current.element.offsetWidth
      }

      Object.freeze(size)
      if (mounted.current && !areBoundsEqual(state.current.lastBounds, size)) {
        set((state.current.lastBounds = size))
      }
    }
    return [
      callback,
      resizeDebounce ? createDebounce(callback, resizeDebounce) : callback,
      scrollDebounce ? createDebounce(callback, scrollDebounce) : callback,
    ]
  }, [set, offsetSize, scrollDebounce, resizeDebounce])

  // cleanup current scroll-listeners / observers
  function removeListeners() {
    if (state.current.scrollContainers) {
      state.current.scrollContainers.forEach((element) =>
        element.removeEventListener('scroll', scrollChange, true),
      )
      state.current.scrollContainers = null
    }

    if (state.current.resizeObserver) {
      state.current.resizeObserver.disconnect()
      state.current.resizeObserver = null
    }
  }

  // add scroll-listeners / observers
  function addListeners() {
    if (!state.current.element) return
    state.current.resizeObserver = new ResizeObserver(scrollChange)
    state.current.resizeObserver!.observe(state.current.element)
    if (scroll && state.current.scrollContainers) {
      state.current.scrollContainers.forEach((scrollContainer) =>
        scrollContainer.addEventListener('scroll', scrollChange, {
          capture: true,
          passive: true,
        }),
      )
    }
  }

  // the ref we expose to the user
  const ref = (node: HTMLOrSVGElement | null) => {
    if (!node || node === state.current.element) return
    removeListeners()
    state.current.element = node
    state.current.scrollContainers = findScrollContainers(node)
    addListeners()
  }

  // add general event listeners
  useOnWindowScroll(scrollChange, Boolean(scroll))
  useOnWindowResize(resizeChange)

  // respond to changes that are relevant for the listeners
  useEffect(() => {
    removeListeners()
    addListeners()
  }, [scroll, scrollChange, resizeChange])

  // remove all listeners when the components unmounts
  useEffect(() => removeListeners, [])
  return [ref, bounds, forceRefresh]
}

// Adds native resize listener to window
function useOnWindowResize(onWindowResize: (event: Event) => void) {
  useEffect(() => {
    const cb = onWindowResize
    window.addEventListener('resize', cb)
    return () => void window.removeEventListener('resize', cb)
  }, [onWindowResize])
}
function useOnWindowScroll(onScroll: () => void, enabled: boolean) {
  useEffect(() => {
    if (enabled) {
      const cb = onScroll
      window.addEventListener('scroll', cb, { capture: true, passive: true })
      return () => void window.removeEventListener('scroll', cb, true)
    }
  }, [onScroll, enabled])
}

// Returns a list of scroll offsets
function findScrollContainers(
  element: HTMLOrSVGElement | null,
): HTMLOrSVGElement[] {
  const result: HTMLOrSVGElement[] = []
  if (!element || element === document.body) return result
  const { overflow, overflowX, overflowY } = window.getComputedStyle(element)
  if (
    [overflow, overflowX, overflowY].some(
      (prop) => prop === 'auto' || prop === 'scroll',
    )
  ) {
    result.push(element)
  }
  return [...result, ...findScrollContainers(element.parentElement)]
}

// Checks if element boundaries are equal
const keys: (keyof RectReadOnly)[] = [
  'x',
  'y',
  'top',
  'bottom',
  'left',
  'right',
  'width',
  'height',
]
const areBoundsEqual = (a: RectReadOnly, b: RectReadOnly): boolean =>
  keys.every((key) => a[key] === b[key])
