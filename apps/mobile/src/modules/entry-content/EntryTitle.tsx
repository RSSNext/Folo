import { useEntry } from "@follow/store/entry/hooks"
import { useFeedById } from "@follow/store/feed/hooks"
import { useEntryTranslation } from "@follow/store/translation/hooks"
import { useAtomValue, useSetAtom } from "jotai"
import { use } from "react"
import { View } from "react-native"

import { useActionLanguage, useGeneralSettingKey } from "@/src/atoms/settings/general"
import { UserAvatar } from "@/src/components/ui/avatar/UserAvatar"
import { FeedIcon } from "@/src/components/ui/icon/feed-icon"
import { Text } from "@/src/components/ui/typography/Text"
import { EntryContentContext, useEntryContentContext } from "@/src/modules/entry-content/ctx"

import { EntryTranslation } from "../entry-list/templates/EntryTranslation"

export const EntryTitle = ({ title, entryId }: { title: string; entryId: string }) => {
  const { showAITranslationAtom } = useEntryContentContext()
  const showTranslationOnce = useAtomValue(showAITranslationAtom)
  const enableTranslation = useGeneralSettingKey("translation") || showTranslationOnce
  const actionLanguage = useActionLanguage()
  const translation = useEntryTranslation({
    entryId,
    language: actionLanguage,
    setting: enableTranslation,
  })
  const { titleHeightAtom } = use(EntryContentContext)
  const setTitleHeight = useSetAtom(titleHeightAtom)
  return (
    <View
      onLayout={(e) => {
        setTitleHeight(e.nativeEvent.layout.height)
      }}
    >
      <EntryTranslation
        className="text-label text-title1 px-5 font-bold leading-snug"
        source={title}
        target={translation?.title}
        bilingual
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
  const feed = useFeedById(entry?.feedId as string)
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
