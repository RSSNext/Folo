import { useEntryReadHistory } from "@follow/store/entry/hooks"
import { View } from "react-native"

import { UserAvatar } from "@/src/components/ui/avatar/UserAvatar"
import { NativePressable } from "@/src/components/ui/pressable/NativePressable"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { ProfileScreen } from "@/src/screens/(modal)/ProfileScreen"

export const EntryReadHistory = ({ entryId }: { entryId: string }) => {
  const data = useEntryReadHistory(entryId, 6)
  const navigation = useNavigation()
  if (!data?.entryReadHistories) return null
  return (
    <View className="flex-row items-center justify-center">
      {data?.entryReadHistories.userIds.map((userId, index) => {
        const user = data.users[userId]
        if (!user) return null
        return (
          <NativePressable
            onPress={() => {
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
          </NativePressable>
        )
      })}
    </View>
  )
}
