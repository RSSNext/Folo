'use client'

import { softSpringPreset } from '~/constants/spring'

import { createTransitionView } from './factor'

export const BottomToUpSoftScaleTransitionView = createTransitionView({
  from: { opacity: 0.00001, scale: 0.96, y: 10 },
  to: {
    y: 0,
    scale: 1,
    opacity: 1,
  },
  preset: softSpringPreset,
})
