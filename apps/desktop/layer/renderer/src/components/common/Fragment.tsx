import type { FC, ReactNode } from "react"
import { Fragment } from "react"

export const SafeFragment: FC<{ children: ReactNode }> = ({ children, ..._rest }) => (
  <Fragment>{children}</Fragment>
)
