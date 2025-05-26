import { UserRole } from "@follow/constants"
import type { UserSchema } from "@follow/database/src/schemas/types"
import { UserService } from "@follow/database/src/services/user"
import type { AuthSession } from "@follow/shared"

import { apiClient } from "@/src/lib/api-fetch"
import { changeEmail, sendVerificationEmail, twoFactor, updateUser } from "@/src/lib/auth"
import { toast } from "@/src/lib/toast"
import { honoMorph } from "@/src/morph/hono"

import type { Hydratable } from "../internal/base"
import { createImmerSetter, createTransaction, createZustandStore } from "../internal/helper"
import type { UserProfileEditable } from "./types"

export type UserModel = UserSchema

export type MeModel = UserModel & {
  emailVerified?: boolean
  twoFactorEnabled?: boolean | null
}
type UserStore = {
  users: Record<string, UserModel>
  whoami: MeModel | null
  role: UserRole
}

export const useUserStore = createZustandStore<UserStore>("user")(() => ({
  users: {},
  whoami: null,
  role: UserRole.Trial,
}))

const get = useUserStore.getState
const immerSet = createImmerSetter(useUserStore)

class UserSyncService {
  async whoami() {
    const res = (await (apiClient["better-auth"] as any)[
      "get-session"
    ].$get()) as AuthSession | null
    if (res) {
      const user = honoMorph.toUser(res.user, true)
      immerSet((state) => {
        state.whoami = { ...user, emailVerified: res.user.emailVerified }
        state.role = res.role as UserRole
      })
      userActions.upsertMany([user])

      return res.user
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
      await updateUser({
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
    await sendVerificationEmail({ email: me.email! })
    toast.success("Verification email sent")
  }

  async updateTwoFactor(enabled: boolean, password: string) {
    const me = get().whoami

    if (!me) throw new Error("user not login")

    const res = enabled
      ? await twoFactor.enable({ password })
      : await twoFactor.disable({ password })

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
      await changeEmail({ newEmail: email })
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
    const res = await apiClient.invitations.use.$post({ json: { code } })
    if (res.code === 0) {
      immerSet((state) => {
        state.role = UserRole.User
      })
    }

    return res
  }

  async fetchUser(userId: string) {
    const res = await apiClient.profiles.$get({ query: { id: userId } })
    if (res.code === 0) {
      const { whoami } = get()
      immerSet((state) => {
        state.users[userId] = {
          email: null,
          isMe: whoami?.id === userId,
          ...res.data,
        }
      })
    }

    return res.data
  }
}

class UserActions implements Hydratable {
  async hydrate() {
    const users = await UserService.getUserAll()
    userActions.upsertManyInSession(users)
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
      })
    })
    tx.persist(() => UserService.removeCurrentUser())
    await tx.run()
  }
}

export const userSyncService = new UserSyncService()
export const userActions = new UserActions()
