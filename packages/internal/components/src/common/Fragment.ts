import * as React from "react"
import { createElement } from "react"

export const PassviseFragment = ({ children }: { children: React.ReactNode }) => {
  return createElement(React.Fragment, null, children)
}
