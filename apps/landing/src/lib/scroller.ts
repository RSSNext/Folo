'use client'

import { animateValue } from 'motion/react'

import { microDampingPreset } from '~/constants/spring'

// TODO scroller lock
export const springScrollTo = (y: number) => {
  const scrollTop =
    // FIXME latest version framer will ignore keyframes value `0`
    document.documentElement.scrollTop || document.body.scrollTop

  const stopSpringScrollHandler = () => {
    animation.stop()
  }
  const animation = animateValue({
    keyframes: [scrollTop + 1, y],
    autoplay: true,
    ...microDampingPreset,
    onPlay() {
      window.addEventListener('wheel', stopSpringScrollHandler)
      window.addEventListener('touchmove', stopSpringScrollHandler)
    },

    onUpdate(latest) {
      if (latest <= 0) {
        animation.stop()
      }
      window.scrollTo(0, latest)
    },
  })

  animation.then(() => {
    window.removeEventListener('wheel', stopSpringScrollHandler)
    window.removeEventListener('touchmove', stopSpringScrollHandler)
  })
  return animation
}

export const springScrollToTop = () => {
  return springScrollTo(0)
}

export const springScrollToElement = (element: HTMLElement, delta = 40) => {
  const y = calculateElementTop(element)

  const to = y + delta
  return springScrollTo(to)
}

const calculateElementTop = (el: HTMLElement) => {
  let top = 0
  while (el) {
    top += el.offsetTop
    el = el.offsetParent as HTMLElement
  }
  return top
}
