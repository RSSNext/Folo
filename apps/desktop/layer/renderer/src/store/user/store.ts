import type { UserModel } from "@follow/models/types"
import { create, keyResolver, windowScheduler } from "@yornaath/batshit"
import { produce } from "immer"

import { apiClient } from "~/lib/api-fetch"

import { createZustandStore } from "../utils/helper"

interface UserStoreState {
  users: Record<string, UserModel>
}
export const useUserStore = createZustandStore<UserStoreState>("user")(() => ({
  users: {},
}))
const avatarBatcher = create({
  fetcher: async (ids: string[]) => {
    const { data: res } = await apiClient.profiles.batch.$post({
      json: { ids },
    })

    const result = Array.from({ length: ids.length }).fill(null) as (typeof res)[string][]
    for (const [i, id] of ids.entries()) {
      result[i] = res[id]!
    }
    return result
  },
  resolver: keyResolver("id"),
  scheduler: windowScheduler(1000),
})

const { getState: get, setState: set } = useUserStore
class UserActions {
  upsert(user: UserModel | UserModel[] | Record<string, UserModel>) {
    if (!user) return
    if (Array.isArray(user)) {
      set((state) =>
        produce(state, (state) => {
          for (const u of user) {
            if (u?.id) {
              state.users[u.id] = u
            }
          }
        }),
      )
      return
    }
    const idKeyValue = user.id
    if (typeof idKeyValue === "string") {
      set((state) => ({
        users: {
          ...state.users,
          [idKeyValue]: user as UserModel,
        },
      }))
    } else {
      for (const id in user) {
        set((state) => ({
          users: {
            ...state.users,
            [id]: user[id],
          },
        }))
      }
    }
  }

  async getOrFetchProfile(id: string) {
    const user = get().users[id]
    if (user) return user
    const result = (await avatarBatcher.fetch(id)) as UserModel
    if (!result) return null
    this.upsert(result)
    return result
  }

  async getBoosters(feedId: string) {
    const res = await apiClient.boosts.boosters.$get({
      query: {
        feedId,
      },
    })

    this.upsert(res.data)

    return res.data
  }
}

export const userActions = new UserActions()
