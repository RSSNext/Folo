'use client'

import { createContextState } from 'foxact/create-context-state'
import { useIsomorphicLayoutEffect } from 'foxact/use-isomorphic-layout-effect'
import { memo, useEffect, useRef } from 'react'

import { ProviderComposer } from '~/components/common/ProviderComposer'
import { useStateToRef } from '~/hooks/common/use-state-ref'
import { clsxm } from '~/lib/helper'

import { usePageScrollDirection } from '../root/page-scroll-info-provider'

const [
  WrappedElementProviderInternal,
  useWrappedElement,
  useSetWrappedElement,
] = createContextState<HTMLDivElement | null>(undefined as any)

const [
  ElementSizeProviderInternal,
  useWrappedElementSize,
  useSetWrappedElementSize,
] = createContextState({
  h: 0,
  w: 0,
})

const [
  ElementPositsionProviderInternal,
  useWrappedElementPositsion,
  useSetElementPositsion,
] = createContextState({
  x: 0,
  y: 0,
})

const [
  IsEOArticleElementProviderInternal,
  useIsEoFWrappedElement,
  useSetIsEOArticleElement,
] = createContextState<boolean>(false)

const Providers = [
  <WrappedElementProviderInternal key="ArticleElementProviderInternal" />,
  <ElementSizeProviderInternal key="ElementSizeProviderInternal" />,
  <ElementPositsionProviderInternal key="ElementPositsionProviderInternal" />,
  <IsEOArticleElementProviderInternal key="IsEOArticleElementProviderInternal" />,
]
const WrappedElementProvider: Component = ({ children, className }) => {
  return (
    <ProviderComposer contexts={Providers}>
      <ArticleElementResizeObserver />
      <Content className={className}>{children}</Content>
    </ProviderComposer>
  )
}
const ArticleElementResizeObserver = () => {
  const setSize = useSetWrappedElementSize()
  const setPos = useSetElementPositsion()
  const $article = useWrappedElement()
  useIsomorphicLayoutEffect(() => {
    if (!$article) return
    const { height, width, x, y } = $article.getBoundingClientRect()
    setSize({ h: height, w: width })
    setPos({ x, y })

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      const { height, width, x, y } = entry.contentRect
      setSize({ h: height, w: width })
      setPos({ x, y })
    })
    observer.observe($article)
    return () => {
      observer.unobserve($article)
      observer.disconnect()
    }
  }, [$article])

  return null
}

const Content: Component = memo(({ children, className }) => {
  const setElement = useSetWrappedElement()

  return (
    <div className={clsxm('relative', className)} ref={setElement}>
      {children}
      <EOADetector />
    </div>
  )
})

Content.displayName = 'ArticleElementProviderContent'

const EOADetector: Component = () => {
  const dir = usePageScrollDirection()
  const getDir = useStateToRef(dir)
  const setter = useSetIsEOArticleElement()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const $el = ref.current
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        // if (yhRef.current < ) return
        if (!entry.isIntersecting && getDir.current === 'down') {
          return
        }

        setter(entry.isIntersecting)
      },
      {
        rootMargin: '0px 0px 0px 0px',
      },
    )

    observer.observe($el)
    return () => {
      observer.unobserve($el)
      observer.disconnect()
    }
  }, [])

  return <div ref={ref} />
}

export {
  useIsEoFWrappedElement,
  useSetWrappedElement,
  useWrappedElement,
  useWrappedElementPositsion,
  useWrappedElementSize,
  WrappedElementProvider,
}
