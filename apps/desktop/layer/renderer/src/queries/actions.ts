import { useAuthQuery } from "~/hooks/common/useBizQuery"
import { defineQuery } from "~/lib/defineQuery"
import { actionActions } from "~/store/action"

export const action = {
  getAll: () => defineQuery(["actions"], () => actionActions.fillRemoteActions()),
}

export const useActionsQuery = () =>
  useAuthQuery(action.getAll(), {
    staleTime: Infinity,
  })
