'use client'

import type { FC, PropsWithChildren } from 'react'
import * as React from 'react'
import { useEffect } from 'react'
import type { IntersectionOptions } from 'react-intersection-observer'
import { useInView } from 'react-intersection-observer'

export type LazyLoadProps = {
  offset?: number
  placeholder?: React.ReactNode
} & IntersectionOptions
export const LazyLoad: FC<PropsWithChildren & LazyLoadProps> = (props) => {
  const { placeholder = null, offset = 0, ...rest } = props
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: `${offset || 0}px`,
    ...rest,
  })
  const [isLoaded, setIsLoaded] = React.useState(false)
  useEffect(() => {
    if (inView) {
      setIsLoaded(true)
    }
  }, [inView])

  return (
    <>
      {!isLoaded && (
        <span data-hide-print data-testid="lazyload-indicator" ref={ref} />
      )}
      {!inView ? placeholder : props.children}
    </>
  )
}
