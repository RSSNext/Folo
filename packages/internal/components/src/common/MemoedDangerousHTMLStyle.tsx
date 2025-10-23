import type { FC } from "react"
import { memo, useMemo } from "react"
import * as React from "react"

export const MemoedDangerousHTMLStyle: FC<
  {
    children: string
  } & React.DetailedHTMLProps<React.StyleHTMLAttributes<HTMLStyleElement>, HTMLStyleElement> &
    Record<string, unknown>
> = memo(({ children, ...rest }) => (
  <style
    {...rest}
    dangerouslySetInnerHTML={useMemo(
      () => ({
        __html: children,
      }),
      [children],
    )}
  />
))
