import { useEntryIsInbox } from "@follow/store/entry/hooks"
import { userActions } from "@follow/store/user/store"
import { useQuery } from "@tanstack/react-query"
import { Pressable, View } from "react-native"

import { UserAvatar } from "@/src/components/ui/avatar/UserAvatar"
import { apiClient } from "@/src/lib/api-fetch"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { ProfileScreen } from "@/src/screens/(modal)/ProfileScreen"

export const EntryReadHistory = ({ entryId }: { entryId: string }) => {
  const isInboxEntry = useEntryIsInbox(entryId)
  const { data } = useQuery({
    queryKey: ["entry-read-history", entryId],
    queryFn: () => {
      return apiClient.entries["read-histories"][":id"].$get({
        param: {
          id: entryId,
        },
        query: {
          size: 6,
        },
      })
    },
    staleTime: 1000 * 60 * 5,
    enabled: !isInboxEntry,
  })
  const navigation = useNavigation()
  if (!data?.data.entryReadHistories) return null
  return (
    <View className="flex-row items-center justify-center">
      {data?.data.entryReadHistories.userIds.map((userId, index) => {
        const user = data.data.users[userId]
        if (!user) return null
        return (
          <Pressable
            onPress={() => {
              userActions.upsertMany([
                {
                  handle: user.handle,
                  id: user.id,
                  name: user.name,
                  image: user.image,
                  isMe: false,
                  email: null,
                  emailVerified: null,
                },
              ])

              navigation.presentControllerView(ProfileScreen, {
                userId: user.id,
              })
            }}
            className="border-system-background bg-tertiary-system-background overflow-hidden rounded-full border-2"
            key={userId}
            style={{
              transform: [
                {
                  translateX: index * -10,
                },
              ],
            }}
          >
            <UserAvatar
              preview={false}
              size={25}
              name={user.name!}
              image={user.image}
              className="border-secondary-system-fill border"
            />
          </Pressable>
        )
      })}
    </View>
  )
}
