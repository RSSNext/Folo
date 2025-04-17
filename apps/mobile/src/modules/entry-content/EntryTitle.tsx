import { useSetAtom } from "jotai"
import { useContext } from "react"
import { Text, View } from "react-native"

import { UserAvatar } from "@/src/components/ui/avatar/UserAvatar"
import { FeedIcon } from "@/src/components/ui/icon/feed-icon"
import { EntryContentContext } from "@/src/modules/entry-content/ctx"
import { useEntry } from "@/src/store/entry/hooks"
import { useFeed } from "@/src/store/feed/hooks"
import { useEntryTranslation } from "@/src/store/translation/hooks"

import { EntryTranslation } from "../entry-list/templates/EntryTranslation"

export const EntryTitle = ({ title, entryId }: { title: string; entryId: string }) => {
  const translation = useEntryTranslation(entryId)

  const { titleHeightAtom } = useContext(EntryContentContext)
  const setTitleHeight = useSetAtom(titleHeightAtom)

  return (
    <View
      onLayout={(e) => {
        setTitleHeight(e.nativeEvent.layout.height)
      }}
    >
      <EntryTranslation
        className="text-label px-4 text-4xl font-bold leading-snug"
        source={title}
        target={translation?.title}
      />
    </View>
  )
}

export const EntrySocialTitle = ({ entryId }: { entryId: string }) => {
  const entry = useEntry(entryId, (entry) => {
    return {
      authorAvatar: entry.authorAvatar,
      author: entry.author,
      feedId: entry.feedId,
    }
  })

  const feed = useFeed(entry?.feedId as string)

  return (
    <View className="flex-row items-center gap-3 px-4">
      {entry?.authorAvatar ? (
        <UserAvatar size={28} name={entry?.author || ""} image={entry?.authorAvatar} />
      ) : (
        feed && <FeedIcon feed={feed} size={28} />
      )}
      <Text className="text-label text-[16px] font-semibold">
        {entry?.author || feed?.title || ""}
      </Text>
    </View>
  )
}
