import type { FC, PropsWithChildren } from "react"
import { createPortal } from "react-dom"

import { useRootPortal } from "./provider"

export const RootPortal: FC<
  {
    to?: HTMLElement | null
  } & PropsWithChildren
> = (props) => {
  const to = useRootPortal()

  if (props.to === null) return props.children

  return createPortal(props.children, props.to || to || document.body)
}
