import { useMutation } from "@tanstack/react-query"

import { followClient } from "~/lib/api-client"
import { defineQuery } from "~/lib/defineQuery"

import type { MutationBaseProps } from "./types"

export const useInvitationMutation = ({ onError }: MutationBaseProps = {}) =>
  useMutation({
    mutationFn: (code: string) => followClient.api.invitations.use({ code }),

    onError: (error) => {
      onError?.(error)
    },
  })

export const invitations = {
  list: () =>
    defineQuery(["invitations"], async () => {
      const res = await followClient.api.invitations.list()
      return res.data
    }),

  limitation: () =>
    defineQuery(["invitations", "limitation"], async () => {
      const res = await followClient.api.invitations.getLimitation()
      return res.data
    }),
}
