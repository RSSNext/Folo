import { useMutation } from "@tanstack/react-query"

import { apiClient } from "~/lib/api-fetch"
import { defineQuery } from "~/lib/defineQuery"

import type { MutationBaseProps } from "./types"

export const useInvitationMutation = ({ onError }: MutationBaseProps = {}) =>
  useMutation({
    mutationFn: (code: string) => apiClient.invitations.use.$post({ json: { code } }),

    onError: (error) => {
      onError?.(error)
    },
  })

export const invitations = {
  list: () =>
    defineQuery(["invitations"], async () => {
      const res = await apiClient.invitations.$get()
      return res.data
    }),

  limitation: () =>
    defineQuery(["invitations", "limitation"], async () => {
      const res = await apiClient.invitations.limitation.$get()
      return res.data
    }),
}
