import type { ReactEventHandler } from 'react'

export const stopPropagation: ReactEventHandler<any> = (e) =>
  e.stopPropagation()

export const preventDefault: ReactEventHandler<any> = (e) => e.preventDefault()

export const transitionViewIfSupported = (updateCb: () => any) => {
  if (window.matchMedia(`(prefers-reduced-motion: reduce)`).matches) {
    updateCb()
    return
  }
  if (document.startViewTransition) {
    document.startViewTransition(updateCb)
  } else {
    updateCb()
  }
}
