export enum FeedViewType {
  Articles = 0,
  SocialMedia = 1,
  Pictures = 2,
  Videos = 3,
  Audios = 4,
  Notifications = 5,
}

export enum Routes {
  Timeline = "/timeline",
  Discover = "/discover",
}

export enum UserRole {
  Admin = "admin",
  PreProTrial = "pre_pro_trial",
  PrePro = "pre_pro",
  Free = "free",
  FreeDeprecated = "trial",
}

export const UserRoleName: Record<UserRole, string> = {
  [UserRole.Admin]: "Admin",
  [UserRole.PreProTrial]: "Early Premium Trial",
  [UserRole.PrePro]: "Early Premium",
  [UserRole.Free]: "Free",
  [UserRole.FreeDeprecated]: "Free",
} as const
