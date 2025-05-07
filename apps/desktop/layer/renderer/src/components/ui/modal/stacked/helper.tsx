import type { Enable } from "re-resizable"
import type { Context, PropsWithChildren } from "react"
import { memo, use } from "react"

export const InjectContext = (Context: Context<any>) => {
  const ctxValue = use(Context)
  return memo(({ children }: PropsWithChildren) => <Context value={ctxValue}>{children}</Context>)
}

export function resizableOnly(...positions: (keyof Enable)[]) {
  const enable: Enable = {
    top: false,
    right: false,
    bottom: false,
    left: false,
    topRight: false,
    bottomRight: false,
    bottomLeft: false,
    topLeft: false,
  }

  for (const position of positions) {
    enable[position] = true
  }
  return enable
}
