import type { Key, ReactNode } from "react"
import { isValidElement } from "react"

export const getGroupedListChildKey = (child: ReactNode, index: number): Key => {
  return isValidElement(child) ? (child.key ?? index) : index
}
