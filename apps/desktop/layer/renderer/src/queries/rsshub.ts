import { userActions } from "@follow/store/user/store"
import { useMutation } from "@tanstack/react-query"

import { apiClient } from "~/lib/api-fetch"
import { defineQuery } from "~/lib/defineQuery"
import { toastFetchError } from "~/lib/error-parser"

import type { MutationBaseProps } from "./types"

export const useSetRSSHubMutation = ({ onError }: MutationBaseProps = {}) =>
  useMutation({
    mutationFn: (data: { id: string | null; durationInMonths?: number; TOTPCode?: string }) =>
      apiClient.rsshub.use.$post({ json: data }),

    onSuccess: (_, variables) => {
      rsshub.list().invalidate()
      rsshub.status().invalidate()

      if (variables.id) {
        rsshub.get({ id: variables.id }).invalidate()
      }
    },

    onError: (error) => {
      onError?.(error)
      toastFetchError(error)
    },
  })

export const useAddRSSHubMutation = ({ onError }: MutationBaseProps = {}) =>
  useMutation({
    mutationFn: ({
      baseUrl,
      accessKey,
      id,
    }: {
      baseUrl: string
      accessKey?: string
      id?: string
    }) =>
      apiClient.rsshub.$post({
        json: {
          baseUrl,
          accessKey,
          id,
        },
      }),

    onSuccess: (_) => {
      rsshub.list().invalidate()
      rsshub.status().invalidate()
    },

    onError: (error) => {
      onError?.(error)
      toastFetchError(error)
    },
  })

export const useDeleteRSSHubMutation = ({ onError }: MutationBaseProps = {}) =>
  useMutation({
    mutationFn: (id: string) => apiClient.rsshub.$delete({ json: { id } }),

    onError: (error) => {
      onError?.(error)
      toastFetchError(error)
    },
  })

export const rsshub = {
  get: ({ id }: { id: string }) =>
    defineQuery(["rsshub", "get", id], async () => {
      const res = await apiClient.rsshub.$get({ query: { id } })
      return res.data
    }),

  list: () =>
    defineQuery(["rsshub", "list"], async () => {
      const res = await apiClient.rsshub.list.$get()
      userActions.upsertMany(res.data.map((item) => item.owner).filter((item) => item !== null))

      return res.data
    }),

  status: () =>
    defineQuery(["rsshub", "status"], async () => {
      const res = await apiClient.rsshub.status.$get()
      return res.data
    }),
}
