"use client"

import type { JSX } from "react"
import { cloneElement } from "react"

export const ProviderComposer: Component<{
  contexts: JSX.Element[]
}> = ({ contexts, children }) =>
  contexts.reduceRight(
    (kids: any, parent: any) => cloneElement(parent, { children: kids }),
    children,
  )
