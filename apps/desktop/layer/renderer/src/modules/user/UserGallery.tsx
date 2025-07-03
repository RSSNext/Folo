import type { UserModel } from "@follow/store/user/store"

import { UserAvatar } from "~/modules/user/UserAvatar"

interface UserGalleryProps {
  users: UserModel[]
  dedupe?: boolean
  limit?: number
}

export const UserGallery = ({ users, limit = 18 }: UserGalleryProps) => {
  const displayedUsers = users.slice(0, limit)

  return (
    <div className="mx-auto flex w-fit max-w-80 flex-wrap gap-4">
      {displayedUsers.map((user) => (
        <div key={user.id} className="size-8">
          <UserAvatar
            className="h-auto p-0"
            avatarClassName="size-8"
            userId={user?.id}
            enableModal={true}
            hideName={true}
          />
        </div>
      ))}
    </div>
  )
}
