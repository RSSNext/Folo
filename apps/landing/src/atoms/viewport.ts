import type { ExtractAtomValue } from 'jotai'
import { atom, useAtomValue } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { useCallback } from 'react'

export const viewportAtom = atom({
  /**
   * 640px
   */
  sm: false,

  /**
   * 768px
   */
  md: false,

  /**
   * 1024px
   */
  lg: false,

  /**
   * 1280px
   */
  xl: false,

  /**
   * 1536px
   */
  '2xl': false,

  h: 0,
  w: 0,
})

export const useViewport = <T>(
  selector: (value: ExtractAtomValue<typeof viewportAtom>) => T,
): T =>
  useAtomValue(
    // @ts-ignore
    selectAtom(
      viewportAtom,
      useCallback((atomValue) => selector(atomValue), []),
    ),
  )

export const useIsMobile = () =>
  useViewport(
    useCallback(
      (v: ExtractAtomValue<typeof viewportAtom>) =>
        (v.sm || v.md || !v.sm) && !v.lg,
      [],
    ),
  )
