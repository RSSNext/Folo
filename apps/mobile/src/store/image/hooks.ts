import { useQuery } from "@tanstack/react-query"

import { imageSyncService } from "./store"

export const usePrefetchImageColors = (url?: string | null) => {
  useQuery({
    queryKey: ["image", "colors", url],
    queryFn: () => imageSyncService.getColors(url),
    enabled: !!url,
  })
}
