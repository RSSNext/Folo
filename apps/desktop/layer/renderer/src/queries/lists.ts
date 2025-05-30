import { useAuthQuery } from "~/hooks/common"
import { defineQuery } from "~/lib/defineQuery"
import { listActions } from "~/store/list"

export const lists = {
  list: () =>
    defineQuery(["lists"], async () => listActions.fetchOwnedLists(), {
      rootKey: ["lists"],
    }),
  byId: ({ id, noExtras }: { id: string; noExtras?: boolean }) =>
    defineQuery(["lists", id, `${noExtras}`], async () => listActions.fetchListById(id, noExtras), {
      rootKey: ["lists"],
    }),
}

export const useList = ({ id, noExtras }: { id?: string; noExtras?: boolean }) =>
  useAuthQuery(lists.byId({ id: id!, noExtras }), {
    enabled: !!id,
  })
