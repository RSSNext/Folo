'use client'

import { throttle } from 'es-toolkit'
import { useIsomorphicLayoutEffect } from 'foxact/use-isomorphic-layout-effect'
import { atom, useAtomValue, useSetAtom } from 'jotai'
import type { FC, PropsWithChildren } from 'react'
import { startTransition, useMemo, useRef } from 'react'

import { setIsInteractive } from '~/atoms/is-interactive'
import { createAtomSelector } from '~/lib/jotai'

const pageScrollLocationAtom = atom(0)
const pageScrollDirectionAtom = atom<'up' | 'down' | null>(null)

export const PageScrollInfoProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      <ScrollDetector />
      {children}
    </>
  )
}

const ScrollDetector = () => {
  const setPageScrollLocation = useSetAtom(pageScrollLocationAtom)
  const setPageScrollDirection = useSetAtom(pageScrollDirectionAtom)
  const prevScrollY = useRef(0)
  const setIsInteractiveOnceRef = useRef(false)

  // const lastTime = useRef(0)
  // const setScrollSpeed = useSetAtom(pageScrollSpeedAtom)

  useIsomorphicLayoutEffect(() => {
    const scrollHandler = throttle(() => {
      if (!setIsInteractiveOnceRef.current) {
        setIsInteractive(true)
        setIsInteractiveOnceRef.current = true
      }
      const currentTop = document.documentElement.scrollTop

      setPageScrollDirection(
        prevScrollY.current - currentTop > 0 ? 'up' : 'down',
      )
      prevScrollY.current = currentTop
      startTransition(() => {
        setPageScrollLocation(prevScrollY.current)
      })
    }, 16)
    window.addEventListener('scroll', scrollHandler)

    scrollHandler()

    return () => {
      window.removeEventListener('scroll', scrollHandler)
    }
  }, [])

  return null
}

const usePageScrollLocation = () => useAtomValue(pageScrollLocationAtom)
const usePageScrollDirection = () => useAtomValue(pageScrollDirectionAtom)

const usePageScrollLocationSelector = createAtomSelector(pageScrollLocationAtom)
const usePageScrollDirectionSelector = createAtomSelector(
  pageScrollDirectionAtom,
)

const useIsScrollUpAndPageIsOver = (threshold: number) => {
  return useAtomValue(
    useMemo(
      () =>
        atom((get) => {
          const scrollLocation = get(pageScrollLocationAtom)
          const scrollDirection = get(pageScrollDirectionAtom)
          return scrollLocation > threshold && scrollDirection === 'up'
        }),
      [threshold],
    ),
  )
}
export {
  useIsScrollUpAndPageIsOver,
  usePageScrollDirection,
  usePageScrollDirectionSelector,
  usePageScrollLocation,
  usePageScrollLocationSelector,
}
