import type { FC, PropsWithChildren } from "react"

declare global {
  export type Component<P = object> = FC<Prettify<ComponentType & P>>

  export type ComponentWithRef<P = object, Ref = object> = FC<ComponentWithRefType<P, Ref>>
  export type ComponentWithRefType<P = object, Ref = object> = Prettify<
    ComponentType<P> & {
      ref?: React.Ref<Ref>
    }
  >

  export type ComponentType<P = object> = {
    className?: string
  } & PropsWithChildren &
    P

  /**
   * This function is a macro, will replace in the build stage.
   */
  export function tw(strings: TemplateStringsArray, ...values: any[]): string
}

declare module "react" {
  export interface AriaAttributes {
    "data-testid"?: string
    "data-hide-in-print"?: boolean
  }
}

export {}
