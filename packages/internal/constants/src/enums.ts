export { FeedViewType } from "@follow-app/client-sdk"
export enum Routes {
  Timeline = "/timeline",
  Discover = "/discover",
}

export enum UserRole {
  Admin = "admin",
  PreProTrial = "pre_pro_trial",
  Free = "free",
  /**
   * @deprecated
   * @see UserRole.Free
   */
  // TODO: remove this
  Trial = "trial",
  Pro = "pro",
  Plus = "plus",
  Basic = "basic",
}

export const UserRoleName: Record<UserRole, string> = {
  [UserRole.Admin]: "Admin",
  [UserRole.PreProTrial]: "Pro Preview Trial",
  [UserRole.Free]: "Free",
  /**
   * @deprecated
   * @see UserRole.Free
   */
  [UserRole.Trial]: "Free",
  [UserRole.Pro]: "Pro",
  [UserRole.Plus]: "Plus",
  [UserRole.Basic]: "Basic",
} as const

export const UserRolePriority: Record<UserRole, number> = {
  [UserRole.Admin]: 4,
  [UserRole.Pro]: 3,
  [UserRole.Plus]: 2,
  [UserRole.Basic]: 1,
  [UserRole.PreProTrial]: 0,
  [UserRole.Free]: 0,
  [UserRole.Trial]: 0,
} as const

export const isFreeRole = (role?: UserRole | null) => {
  return role
    ? role === UserRole.Free || role === UserRole.Trial || role === UserRole.PreProTrial
    : true
}
