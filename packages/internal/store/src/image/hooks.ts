import { useCallback } from "react"

import { useImagesStore } from "./store"

export const useImageColors = (url?: string | null) => {
  return useImagesStore(
    useCallback(
      (state) => {
        if (!url) {
          return
        }
        return state.images[url]?.colors
      },
      [url],
    ),
  )
}
