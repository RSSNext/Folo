'use client'

import { LazyMotion } from 'motion/react'
import { ThemeProvider } from 'next-themes'
import type { JSX, PropsWithChildren } from 'react'
import { Toaster } from 'sonner'

import { ModalContainer } from '~/components/ui/modal'

import { ProviderComposer } from '../../components/common/ProviderComposer'
import { DebugProvider } from './debug-provider'
import { EventProvider } from './event-provider'
import { JotaiStoreProvider } from './jotai-provider'
import { PageScrollInfoProvider } from './page-scroll-info-provider'
import { ReactQueryProvider } from './react-query-provider'

const loadFeatures = () =>
  import('./framer-lazy-feature').then((res) => res.default)
const contexts: JSX.Element[] = [
  <ThemeProvider key="themeProvider" />,
  <ReactQueryProvider key="reactQueryProvider" />,
  <JotaiStoreProvider key="jotaiStoreProvider" />,

  <LazyMotion features={loadFeatures} strict key="framer" />,
]
export function Providers({ children }: PropsWithChildren) {
  return (
    <>
      <ProviderComposer contexts={contexts}>
        {children}

        <EventProvider key="viewportProvider" />
        <PageScrollInfoProvider key="PageScrollInfoProvider" />
        <DebugProvider key="debugProvider" />
        <Toaster key="toaster" />
        <ModalContainer />
      </ProviderComposer>
    </>
  )
}
