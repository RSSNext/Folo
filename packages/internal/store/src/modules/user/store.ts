import type { UserRole } from "@follow/constants"
import { TOTP_ISSUER } from "@follow/constants"
import type { UserSchema } from "@follow/database/schemas/types"
import { UserService } from "@follow/database/services/user"
import type { AuthUser } from "@follow-app/client-sdk"
import { FollowAPIError } from "@follow-app/client-sdk"
import { create, indexedResolver, windowScheduler } from "@yornaath/batshit"

import { api, authClient } from "../../context"
import type { Hydratable, Resetable } from "../../lib/base"
import { createImmerSetter, createTransaction, createZustandStore } from "../../lib/helper"
import { apiMorph } from "../../morph/api"
import type { UserProfileEditable } from "./types"

export type UserModel = UserSchema

export type MeModel = AuthUser & {
  emailVerified?: boolean
  twoFactorEnabled?: boolean | null
}
export type UserStore = {
  users: Record<string, UserModel>
  whoami: MeModel | null
  role: UserRole | null
  roleEndAt: Date | null
  rsshubSubscriptionLimit?: number | null
  feedSubscriptionLimit?: number | null
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

type ProfileChanges = Omit<Partial<UserProfileEditable>, "handle"> & {
  handle?: string | null
}

/** A profile change the auth server refused. `code` names the check that refused it, if any. */
export class UserUpdateError extends Error {
  readonly code: string | undefined
  readonly status: number | undefined

  constructor(message: string, code?: string, status?: number) {
    super(message)
    this.name = "UserUpdateError"
    this.code = code
    this.status = status
  }
}

/**
 * The fields a profile save sends and keeps, trimmed as the server saves them. The server
 * replaces the social links with whatever a save sends, so they are sent only when the caller
 * sets them: an avatar or name change must not clear them.
 */
const toProfileChanges = (
  data: Partial<UserProfileEditable>,
  currentHandle: string | null | undefined,
): ProfileChanges => {
  const { name, handle, socialLinks, ...rest } = data
  const changes: ProfileChanges = rest

  if (name !== undefined) {
    changes.name = name.trim()
  }
  if (handle !== undefined) {
    const trimmedHandle = handle.trim()
    if (!trimmedHandle) {
      // A blank handle means no handle. Saved as "", it would hit the unique index on handles
      // once another user has one.
      changes.handle = null
    } else {
      // The server keeps a handle stored with spaces around it when a save sends it back
      changes.handle =
        typeof currentHandle === "string" && trimmedHandle === currentHandle.trim()
          ? currentHandle
          : trimmedHandle
    }
  }
  if (socialLinks !== undefined) {
    changes.socialLinks = socialLinks
  }

  return changes
}

class UserSyncService {
  private userBatcher = create({
    fetcher: async (userIds: string[]) => {
      const res = await api().profiles.getBatch({ ids: userIds })

      if (res.code === 0) {
        const { whoami } = get()
        const usersObject = res.data
        const usersArray = Object.values(usersObject)

        immerSet((state) => {
          for (const user of usersArray) {
            state.users[user.id] = {
              ...user,
              email: null,
              isMe: whoami?.id === user.id,
            } as UserModel
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
    const res = await api()
      .auth.getSession()
      .catch((err) => {
        // Only a 401 tells that the session is gone. Connection failures, timeouts and
        // server errors must not sign the user out locally.
        const isUnauthenticated = err instanceof FollowAPIError && err.status === 401
        if (!isUnauthenticated) {
          throw err
        }
        return null
      })

    if (!res) {
      immerSet((state) => {
        state.whoami = null
        state.role = null
        state.roleEndAt = null
        state.rsshubSubscriptionLimit = null
        state.feedSubscriptionLimit = null
      })
      return null
    }

    if (!res.user) return res
    const user = apiMorph.toWhoami(res.user)
    immerSet((state) => {
      state.whoami = { ...user, emailVerified: res.user?.emailVerified ?? false }
      state.role = res.user?.role as UserRole | null
      if (res.user?.roleEndAt) {
        state.roleEndAt = new Date(res.user?.roleEndAt)
      }
      state.rsshubSubscriptionLimit = res.rsshubSubscriptionLimit ?? null
      state.feedSubscriptionLimit = res.feedSubscriptionLimit ?? null
    })
    userActions.upsertMany([user as unknown as UserModel])

    return res
  }

  async updateProfile(data: Partial<UserProfileEditable>) {
    const me = get().whoami
    if (!me) return
    const changes = toProfileChanges(data, me.handle)
    const tx = createTransaction(me)

    tx.store(() => {
      immerSet((state) => {
        if (!state.whoami) return
        state.whoami = { ...state.whoami, ...changes } as MeModel
      })
    })

    tx.request(async () => {
      const res = await authClient().updateUser(changes)
      // The auth client resolves with the error instead of throwing; throw so the change rolls back
      if (res.error) {
        throw new UserUpdateError(
          res.error.message || res.error.statusText,
          res.error.code,
          res.error.status,
        )
      }
    })
    tx.persist(async () => {
      const { whoami } = get()
      if (!whoami) return
      const nextUser = {
        ...whoami,
        ...changes,
      }
      userActions.upsertMany([nextUser as unknown as UserModel])
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
    const res = await authClient().sendVerificationEmail({ email: me.email! })
    if (res.error) {
      throw new Error(res.error.message || res.error.statusText)
    }
  }

  async updateTwoFactor(enabled: boolean, password: string) {
    const me = get().whoami

    if (!me) throw new Error("user not login")

    const res = enabled
      ? await authClient().twoFactor.enable({ password, issuer: TOTP_ISSUER })
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
      const res = await authClient().changeEmail({ newEmail: email })
      if (res.error) {
        throw new Error(res.error.message || res.error.statusText)
      }
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
      userActions.upsertMany([{ ...whoami, email } as unknown as UserModel])
    })
    await tx.run()
  }

  async fetchUser(userId: string | undefined) {
    if (!userId) return null

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
          state.whoami = { ...user, emailVerified: user.emailVerified ?? false } as MeModel
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
      UserService.upsertMany(
        users.map((user) => ({
          ...user,
          isMe: user.isMe || whoami?.id === user.id,
        })),
      ),
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
