import { useQuery } from "@tanstack/react-query"
import { useCallback } from "react"

import { imageSyncService, useImagesStore } from "./store"

export const usePrefetchImageColors = (url?: string | null) => {
  useQuery({
    queryKey: ["image", "colors", url],
    queryFn: () => imageSyncService.getColors(url),
    enabled: !!url,
  })
}

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
