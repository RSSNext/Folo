import type { ComponentType } from "react"
import { memo } from "react"
import isEqual from "react-fast-compare"

interface PartWithState {
  part: {
    state: string
  }
}

export const toolMemo = <P extends PartWithState>(FC: ComponentType<P>): ComponentType<P> =>
  memo(FC, (prev, next) => {
    if (prev.part.state === "output-available") return true
    return isEqual(prev, next)
  }) as ComponentType<P>
