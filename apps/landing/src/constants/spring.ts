import type { Transition } from 'motion/react'

export const reboundPreset: Transition = {
  type: 'spring',
  bounce: 10,
  stiffness: 140,
  damping: 8,
}

export const microDampingPreset: Transition = {
  type: 'spring',
  damping: 24,
}

export const microReboundPreset: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 20,
}

export const softSpringPreset: Transition = {
  duration: 0.35,
  type: 'spring',
  stiffness: 120,
  damping: 20,
}

export const softBouncePreset: Transition = {
  type: 'spring',
  damping: 10,
  stiffness: 100,
}
