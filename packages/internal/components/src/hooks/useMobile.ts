import { useViewport } from "./useViewport"

export const useMobile = () => {
  return useViewport((v) => v.w < 1024 && v.w !== 0)
}

export const isMobile = () => {
  const w = window.innerWidth
  return w < 1024 && w !== 0
}
