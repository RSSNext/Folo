import { useMutation } from "@tanstack/react-query"

import { useAuthQuery } from "~/hooks/common"
import { apiClient } from "~/lib/api-fetch"
import { defineQuery } from "~/lib/defineQuery"

export const messaging = {
  list: () =>
    defineQuery(["messaging"], () => apiClient.messaging.$get(), {
      rootKey: ["messaging"],
    }),
}

export const useMessaging = () => useAuthQuery(messaging.list())

export const useTestMessaging = () =>
  useMutation({
    mutationFn: ({ channel }: { channel: string }) =>
      apiClient.messaging.test.$get({
        query: {
          channel,
        },
      }),
  })
