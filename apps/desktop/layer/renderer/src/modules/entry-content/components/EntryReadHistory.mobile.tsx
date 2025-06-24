import { Avatar, AvatarFallback, AvatarImage } from "@follow/components/ui/avatar/index.js"
import { PresentSheet } from "@follow/components/ui/sheet/Sheet.js"
import { useEntryReadHistory } from "@follow/store/entry/hooks"
import { usePrefetchUser, useUserById } from "@follow/store/user/hooks"
import { lazy } from "react"
import { useEventCallback } from "usehooks-ts"

import { useWhoami } from "~/atoms/user"
import { useAsyncModal } from "~/components/ui/modal/helper/use-async-modal"
import { replaceImgUrlIfNeed } from "~/lib/img-proxy"
import { useUserSubscriptionsQuery } from "~/modules/profile/hooks"

const LazyUserProfileModalContent = lazy(() =>
  import("~/modules/profile/user-profile-modal").then((mod) => ({
    default: mod.UserProfileModalContent,
  })),
)

const LIMIT = 8
export const EntryReadHistory: Component<{ entryId: string }> = ({ entryId }) => {
  const me = useWhoami()
  const data = useEntryReadHistory(entryId)
  const entryHistory = data?.entryReadHistories

  const totalCount = data?.total || 0

  if (!entryHistory) return null
  if (!me) return null
  if (!entryHistory.userIds) return null

  return (
    <div className="animate-in fade-in flex items-center pl-1 duration-200" data-hide-in-print>
      {entryHistory.userIds
        .filter((id) => id !== me?.id)
        .slice(0, LIMIT)

        .map((userId, i) => (
          <EntryUser userId={userId} i={i} key={userId} />
        ))}

      {!!totalCount && totalCount > LIMIT && (
        <PresentSheet
          title="Entry Recent Readers"
          content={<Content entryHistory={entryHistory} />}
          triggerAsChild
        >
          <button
            type="button"
            style={{
              marginLeft: `-${LIMIT * 8}px`,
              zIndex: LIMIT + 1,
            }}
            className="no-drag-region border-border bg-material-medium ring-background relative flex size-7 items-center justify-center rounded-full border ring-2"
          >
            <span className="text-text-secondary text-[10px] font-medium tabular-nums">
              +{Math.min(totalCount - LIMIT, 99)}
            </span>
          </button>
        </PresentSheet>
      )}
    </div>
  )
}

const usePresentUserProfile = () => {
  const present = useAsyncModal()
  return useEventCallback((userId: string) => {
    const useDataFetcher = () => {
      const user = usePrefetchUser(userId)
      const subscriptions = useUserSubscriptionsQuery(user?.data?.id)
      return {
        ...user,
        isLoading: user.isLoading || subscriptions.isLoading,
      }
    }
    type ResponseType = ReturnType<typeof useDataFetcher>["data"]
    return present<ResponseType>({
      id: `user-profile-${userId}`,
      title: (data: ResponseType) => `${data?.name}'s Profile`,
      content: () => <LazyUserProfileModalContent userId={userId} />,
      useDataFetcher,
      overlay: true,
    })
  })
}

const EntryUser: Component<{ userId: string; i: number }> = ({ userId, i }) => {
  const present = usePresentUserProfile()
  const user = useUserById(userId)
  if (!user) return null
  return (
    <button
      className="no-drag-region relative cursor-pointer"
      style={{
        right: `${i * 8}px`,
        zIndex: i,
      }}
      type="button"
      onClick={() => {
        present(userId)
      }}
    >
      <Avatar className="border-border ring-background aspect-square size-7 border ring-1">
        <AvatarImage
          src={replaceImgUrlIfNeed(user?.image || undefined)}
          className="bg-material-ultra-thick"
        />
        <AvatarFallback>{user.name?.slice(0, 2)}</AvatarFallback>
      </Avatar>
    </button>
  )
}
const Content: Component<{
  entryHistory: {
    userIds: string[]
    readCount: number
  }
}> = ({ entryHistory }) => {
  const me = useWhoami()

  return (
    <ul className="flex flex-col gap-2 !text-base">
      {entryHistory?.userIds
        ?.filter((id) => id !== me?.id)
        .slice(LIMIT)
        .map((userId) => (
          <EntryUserRow userId={userId} key={userId} />
        ))}
    </ul>
  )
}
const EntryUserRow: Component<{ userId: string }> = ({ userId }) => {
  const user = useUserById(userId)
  const present = usePresentUserProfile()
  if (!user) return null
  return (
    <li
      onClick={() => {
        present(userId)
      }}
      role="button"
      tabIndex={0}
      className="relative flex min-w-0 max-w-[50ch] shrink-0 items-center gap-2 truncate rounded-md p-1 px-2"
    >
      <Avatar className="border-border ring-background block aspect-square size-7 overflow-hidden rounded-full border ring-1">
        <AvatarImage src={replaceImgUrlIfNeed(user?.image || undefined)} />
        <AvatarFallback>{user.name?.slice(0, 2)}</AvatarFallback>
      </Avatar>

      {user.name && (
        <span className="truncate text-xs font-medium">
          <span>{user.name}</span>
        </span>
      )}
    </li>
  )
}
