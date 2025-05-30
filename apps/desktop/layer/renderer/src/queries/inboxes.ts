import { useAuthQuery } from "~/hooks/common"
import { defineQuery } from "~/lib/defineQuery"
import { inboxActions } from "~/store/inbox"

export const inboxes = {
  byId: ({ id }: { id: string }) =>
    defineQuery(["inboxes", id], async () => inboxActions.fetchInboxById(id), {
      rootKey: ["inboxes"],
    }),
  list: () =>
    defineQuery(["inboxes"], async () => inboxActions.fetchOwnedInboxes(), {
      rootKey: ["inboxes"],
    }),
}

export const useInbox = ({ id }: { id?: string }) =>
  useAuthQuery(inboxes.byId({ id: id! }), {
    enabled: !!id,
  })

export const useInboxList = () =>
  useAuthQuery(inboxes.list(), {
    enabled: true,
  })
