import { useMediaQuery } from "usehooks-ts"

export const useIsPrinting = () => {
  return useMediaQuery("print")
}
