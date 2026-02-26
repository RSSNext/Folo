'use client'

import { createTransitionView } from './factor'

export const LeftToRightTransitionView = createTransitionView({
  from: {
    translateX: -70,
    opacity: 0.001,
  },
  to: {
    translateX: 0,
    opacity: 1,
  },
})
