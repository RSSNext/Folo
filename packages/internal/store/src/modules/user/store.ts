import { UserRole } from "@follow/constants"
import type { UserSchema } from "@follow/database/schemas/types"
import { UserService } from "@follow/database/services/user"
import type { AuthSession } from "@follow/shared/hono"
import { create, indexedResolver, windowScheduler } from "@yornaath/batshit"

import { apiClient, authClient } from "../../context"
import type { Hydratable, Resetable } from "../../lib/base"
import { createImmerSetter, createTransaction, createZustandStore } from "../../lib/helper"
import { honoMorph } from "../../morph/hono"
import type { UserProfileEditable } from "./types"

export type UserModel = UserSchema

export type MeModel = UserModel & {
  emailVerified?: boolean
  twoFactorEnabled?: boolean | null
}
type UserStore = {
  users: Record<string, UserModel>
  whoami: MeModel | null
  role: UserRole | null
  roleEndAt: Date | null
}

const defaultState: UserStore = {
  users: {},
  whoami: null,
  role: null,
  roleEndAt: null,
}

export const useUserStore = createZustandStore<UserStore>("user")(() => defaultState)

const get = useUserStore.getState
const set = useUserStore.setState
const immerSet = createImmerSetter(useUserStore)

class UserSyncService {
  private userBatcher = create({
    fetcher: async (userIds: string[]) => {
      const res = await apiClient().profiles.batch.$post({
        json: { ids: userIds },
      })

      if (res.code === 0) {
        const { whoami } = get()
        const usersObject = res.data
        const usersArray = Object.values(usersObject)

        immerSet((state) => {
          for (const user of usersArray) {
            state.users[user.id] = {
              email: null,
              isMe: whoami?.id === user.id,
              ...user,
            }
          }
        })
        return usersObject
      }
      return {}
    },
    resolver: indexedResolver(),
    scheduler: windowScheduler(100),
  })

  async whoami() {
    const res = (await (apiClient()["better-auth"] as any)[
      "get-session"
    ].$get()) as AuthSession | null
    if (res) {
      const user = honoMorph.toUser(res.user, true)
      immerSet((state) => {
        state.whoami = { ...user, emailVerified: res.user.emailVerified }
        // @ts-expect-error
        state.role = res.role
        if (res.roleEndAt) {
          state.roleEndAt = new Date(res.roleEndAt)
        }
      })
      userActions.upsertMany([user])

      return res
    } else {
      return null
    }
  }

  async updateProfile(data: Partial<UserProfileEditable>) {
    const me = get().whoami
    if (!me) return
    const tx = createTransaction(me)

    tx.store(() => {
      immerSet((state) => {
        if (!state.whoami) return
        state.whoami = { ...state.whoami, ...data }
      })
    })

    tx.request(async () => {
      await authClient().updateUser({
        ...data,
      })
    })
    tx.persist(async () => {
      const { whoami } = get()
      if (!whoami) return
      const nextUser = {
        ...whoami,
        ...data,
      }
      userActions.upsertMany([nextUser])
    })
    tx.rollback(() => {
      immerSet((state) => {
        if (!state.whoami) return
        state.whoami = me
      })
    })
    await tx.run()
  }

  async sendVerificationEmail() {
    const me = get().whoami
    if (!me?.email) return
    await authClient().sendVerificationEmail({ email: me.email! })
  }

  async updateTwoFactor(enabled: boolean, password: string) {
    const me = get().whoami

    if (!me) throw new Error("user not login")

    const res = enabled
      ? await authClient().twoFactor.enable({ password })
      : await authClient().twoFactor.disable({ password })

    if (!res.error) {
      immerSet((state) => {
        if (!state.whoami) return

        // If set enable 2FA, we can't check the 2FA status immediately, must to bind the 2FA app and verify code first
        if (!enabled) state.whoami.twoFactorEnabled = false
      })
    }

    return res
  }

  async updateEmail(email: string) {
    const oldEmail = get().whoami?.email
    if (!oldEmail) return
    const tx = createTransaction(oldEmail)
    tx.store(() => {
      immerSet((state) => {
        if (!state.whoami) return
        state.whoami = { ...state.whoami, email }
      })
    })
    tx.request(async () => {
      const { whoami } = get()
      if (!whoami) return
      await authClient().changeEmail({ newEmail: email })
    })
    tx.rollback(() => {
      immerSet((state) => {
        if (!state.whoami) return
        state.whoami.email = oldEmail
      })
    })
    tx.persist(async () => {
      const { whoami } = get()
      if (!whoami) return
      userActions.upsertMany([{ ...whoami, email }])
    })
    await tx.run()
  }

  async applyInvitationCode(code: string) {
    const res = await apiClient().invitations.use.$post({ json: { code } })
    if (res.code === 0) {
      immerSet((state) => {
        state.role = UserRole.Pro
      })
    }

    return res
  }

  async fetchUser(userId: string | undefined) {
    if (!userId) return null

    // 使用批处理器获取用户
    const user = await this.userBatcher.fetch(userId)
    return user || null
  }

  async fetchUsers(userIds: string[]) {
    const validUserIds = userIds.filter(Boolean)
    if (validUserIds.length === 0) return []

    const users = await Promise.all(validUserIds.map((id) => this.userBatcher.fetch(id)))
    return users.filter(Boolean)
  }
}

class UserActions implements Hydratable, Resetable {
  async hydrate() {
    const users = await UserService.getUserAll()
    userActions.upsertManyInSession(users)
  }

  async reset() {
    const tx = createTransaction()
    tx.store(() => {
      set(defaultState)
    })
    tx.persist(() => UserService.reset())
    await tx.run()
  }

  upsertManyInSession(users: UserModel[]) {
    immerSet((state) => {
      for (const user of users) {
        state.users[user.id] = user
        if (user.isMe) {
          state.whoami = { ...user, emailVerified: user.emailVerified ?? false }
        }
      }
    })
  }

  updateWhoami(data: Partial<MeModel>) {
    immerSet((state) => {
      if (!state.whoami) return
      state.whoami = { ...state.whoami, ...data }
    })
  }

  async upsertMany(users: UserModel[]) {
    const tx = createTransaction()
    tx.store(() => this.upsertManyInSession(users))
    const { whoami } = useUserStore.getState()
    tx.persist(() =>
      UserService.upsertMany(users.map((user) => ({ ...user, isMe: whoami?.id === user.id }))),
    )
    await tx.run()
  }

  async removeCurrentUser() {
    const tx = createTransaction()
    tx.store(() => {
      immerSet((state) => {
        state.whoami = null
        state.role = null
        state.roleEndAt = null
      })
    })
    tx.persist(() => UserService.removeCurrentUser())
    await tx.run()
  }
}

export const userSyncService = new UserSyncService()
export const userActions = new UserActions()
