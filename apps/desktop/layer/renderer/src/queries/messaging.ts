import { useMutation } from "@tanstack/react-query"

import { useAuthQuery } from "~/hooks/common"
import { followClient } from "~/lib/api-client"
import { defineQuery } from "~/lib/defineQuery"

export const messaging = {
  list: () =>
    defineQuery(["messaging"], () => followClient.api.messaging.getTokens(), {
      rootKey: ["messaging"],
    }),
}

export const useMessaging = () => useAuthQuery(messaging.list())

export const useTestMessaging = () =>
  useMutation({
    mutationFn: ({ channel }: { channel: string }) =>
      followClient.api.messaging.testNotification({ channel }),
  })
