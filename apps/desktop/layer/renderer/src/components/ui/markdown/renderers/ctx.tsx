import { createContext, use } from "react"

/**
 * @internal
 */
export const IsInParagraphContext = createContext<boolean>(false)

export const useIsInParagraphContext = () => {
  return use(IsInParagraphContext)
}
