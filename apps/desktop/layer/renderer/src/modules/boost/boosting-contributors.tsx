import { AutoResizeHeight } from "@follow/components/ui/auto-resize-height/index.js"
import { Avatar, AvatarFallback, AvatarImage } from "@follow/components/ui/avatar/index.js"
import type { UserModel } from "@follow/store/user/store"

import { replaceImgUrlIfNeed } from "~/lib/img-proxy"
import { useFeedBoostersQuery } from "~/modules/boost/query"

import { usePresentUserProfileModal } from "../profile/hooks"
import { UserGallery } from "../user/UserGallery"

export const BoostingContributors = ({ feedId }: { feedId: string }) => {
  const { data: boosters, isLoading } = useFeedBoostersQuery(feedId)
  const presentUserProfile = usePresentUserProfileModal("drawer")
  const hasData = !(isLoading || !boosters || boosters.length === 0)

  return (
    <AutoResizeHeight className="mt-4">
      {hasData && (
        <>
          <h2 className="center mb-4 flex text-xl font-bold">
            <i className="i-mgc-user-heart-cute-fi mr-1" />
            Boosting Contributors
          </h2>
          <ul className="space-y-4">
            {boosters.length < 8 ? (
              boosters.map((user) => (
                <UserListItem key={user.id} user={user} onClick={presentUserProfile} />
              ))
            ) : (
              <UserGallery users={boosters} />
            )}
          </ul>
        </>
      )}
    </AutoResizeHeight>
  )
}

const UserListItem = ({
  user,
  onClick,
}: {
  user: UserModel
  onClick: (userId: string) => void
}) => {
  return (
    <li
      key={user.id}
      role="button"
      className="flex items-center space-x-4"
      onClick={() => onClick(user.id)}
    >
      <Avatar className="border-border ring-background block aspect-square size-10 overflow-hidden rounded-full border ring-1">
        <AvatarImage src={replaceImgUrlIfNeed(user?.image || undefined)} />
        <AvatarFallback>{user.name?.slice(0, 2)}</AvatarFallback>
      </Avatar>
      <div>
        <div className="font-semibold">{user.name || user.handle}</div>
        {user.handle && <div className="text-xs text-gray-500">@{user.handle}</div>}
      </div>
    </li>
  )
}
