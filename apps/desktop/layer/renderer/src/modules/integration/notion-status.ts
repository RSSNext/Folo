import { IN_ELECTRON } from "@follow/shared/constants"
import { useQuery } from "@tanstack/react-query"

import { ipcServices } from "~/lib/client"

export const notionStatusQueryKey = ["notion-integration-status"]

export const useNotionStatus = () =>
  useQuery({
    queryKey: notionStatusQueryKey,
    enabled: IN_ELECTRON,
    queryFn: () => {
      const services = ipcServices
      if (!services) throw new Error("Desktop integration unavailable")
      return services.notion.getStatus()
    },
  })
