/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/method-signature-style */
import type { FC, PropsWithChildren } from 'react'

declare global {
  export type NextErrorProps = {
    reset(): void
    error: Error
  }
  export type NextPageParams<P extends {}, Props = {}> = PropsWithChildren<
    {
      params: P
    } & Props
  >

  export type Component<P = {}> = FC<ComponentType & P>

  export type ComponentType<P = {}> = {
    className?: string
  } & PropsWithChildren &
    P

  // TODO should remove in next TypeScript version
  interface Document {
    startViewTransition(callback?: () => void | Promise<void>): ViewTransition
  }

  interface ViewTransition {
    finished: Promise<void>
    ready: Promise<void>
    updateCallbackDone: () => void
    skipTransition(): void
  }
}

declare module 'react' {
  export interface AriaAttributes {
    'data-hide-print'?: boolean
    'data-event'?: string
    'data-testid'?: string
  }
}
