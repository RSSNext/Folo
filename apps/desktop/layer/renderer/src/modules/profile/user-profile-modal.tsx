import { withResponsiveSyncComponent } from "@follow/components/utils/selector.js"

import { UserProfileModalContent as UserProfileModalContentDesktop } from "./user-profile-modal.electron"
import { UserProfileModalContent as UserProfileModalContentMobile } from "./user-profile-modal.mobile"
import type { SubscriptionModalContentProps } from "./user-profile-modal.shared"

export const UserProfileModalContent = withResponsiveSyncComponent<SubscriptionModalContentProps>(
  UserProfileModalContentDesktop,
  UserProfileModalContentMobile,
)
