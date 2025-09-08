import { userActions } from "@follow/store/user/store"
import type { UseRSSHubInstanceRequest } from "@follow-app/client-sdk"
import { useMutation } from "@tanstack/react-query"

import { followClient } from "~/lib/api-client"
import { defineQuery } from "~/lib/defineQuery"
import { toastFetchError } from "~/lib/error-parser"

import type { MutationBaseProps } from "./types"

export const useSetRSSHubMutation = ({ onError }: MutationBaseProps = {}) =>
  useMutation({
    mutationFn: (data: UseRSSHubInstanceRequest) =>
      followClient.api.rsshub.useInstance({ ...data }),

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
      followClient.api.rsshub.createInstance({
        baseUrl,
        accessKey,
        id,
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
    mutationFn: (id: string) => followClient.api.rsshub.deleteInstance({ id }),

    onError: (error) => {
      onError?.(error)
      toastFetchError(error)
    },
  })

export const rsshub = {
  get: ({ id }: { id: string }) =>
    defineQuery(["rsshub", "get", id], async () => {
      const res = await followClient.api.rsshub.getInstance({ id })
      return res.data
    }),

  list: () =>
    defineQuery(["rsshub", "list"], async () => {
      const res = await followClient.api.rsshub.listInstances()
      userActions.upsertMany(res.data.map((item) => item.owner).filter((item) => item !== null))

      return res.data
    }),

  status: () =>
    defineQuery(["rsshub", "status"], async () => {
      const res = await followClient.api.rsshub.getStatus()
      return res.data
    }),
}
