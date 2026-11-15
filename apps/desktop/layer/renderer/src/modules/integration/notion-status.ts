import { IN_ELECTRON } from "@follow/shared/constants"
import { useQuery } from "@tanstack/react-query"

import { notionLocalClient } from "./notion-local"

export const notionStatusQueryKey = ["notion-integration-status"]

export const useNotionStatus = () =>
  useQuery({
    queryKey: notionStatusQueryKey,
    enabled: IN_ELECTRON,
    queryFn: () => notionLocalClient.getStatus(),
  })
