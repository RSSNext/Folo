import type { FC } from "react"
import { createElement } from "react"
import type { JSX } from "react/jsx-runtime"

type WithSelect<T> = T & {
  select: (_s: any) => any
}

export const withSettingEnabled =
  <SE,>(useSettings: WithSelect<() => SE>, condition: (_setting: SE) => boolean) =>
  <P extends JSX.IntrinsicAttributes>(
    IfComponent: FC<P> | keyof JSX.IntrinsicElements,
    ElseComponent: FC<P> | keyof JSX.IntrinsicElements,
  ) =>
  ({ ref, ...props }: P & { ref?: React.Ref<any | null> }) => {
    const res = useSettings.select(condition)
    return res
      ? // @ts-expect-error
        createElement(IfComponent, { ...props, ref })
      : // @ts-expect-error
        createElement(ElseComponent, { ...props, ref })
  }
