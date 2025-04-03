import { PortalProvider } from "@gorhom/portal"
import type { PropsWithChildren } from "react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Share, Text, View } from "react-native"

import {
  EntryContentWebView,
  preloadWebViewEntry,
} from "@/src/components/native/webview/EntryContentWebView"
import { ContextMenu } from "@/src/components/ui/context-menu"
import { openLink } from "@/src/lib/native"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { toast } from "@/src/lib/toast"
import { getHorizontalScrolling, useSelectedView } from "@/src/modules/screen/atoms"
import { EntryDetailScreen } from "@/src/screens/(stack)/entries/[entryId]"
import { useIsEntryStarred } from "@/src/store/collection/hooks"
import { collectionSyncService } from "@/src/store/collection/store"
import { useEntry } from "@/src/store/entry/hooks"
import { unreadSyncService } from "@/src/store/unread/store"

export const EntryItemContextMenu = ({ id, children }: PropsWithChildren<{ id: string }>) => {
  const { t } = useTranslation()
  const entry = useEntry(id)
  const feedId = entry?.feedId
  const view = useSelectedView()
  const isEntryStarred = useIsEntryStarred(id)

  const navigation = useNavigation()
  const handlePressPreview = useCallback(() => {
    const isHorizontalScrolling = getHorizontalScrolling()
    if (entry && !isHorizontalScrolling) {
      preloadWebViewEntry(entry)
      navigation.pushControllerView(EntryDetailScreen, {
        entryId: id,
        view: view!,
      })
    }
  }, [entry, id, navigation, view])

  if (!entry) return null

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>{children}</ContextMenu.Trigger>

      <ContextMenu.Content>
        <ContextMenu.Preview size="STRETCH" onPress={handlePressPreview}>
          {() => (
            <PortalProvider>
              <View className="bg-system-background flex-1">
                <Text className="text-label mt-5 p-4 text-2xl font-semibold" numberOfLines={2}>
                  {entry.title?.trim()}
                </Text>
                <EntryContentWebView entry={entry} />
              </View>
            </PortalProvider>
          )}
        </ContextMenu.Preview>

        <ContextMenu.Item
          key="MarkAsRead"
          onSelect={() => {
            unreadSyncService.markEntryAsRead(id)
          }}
        >
          <ContextMenu.ItemTitle>{t("operation.mark_as_read")}</ContextMenu.ItemTitle>
          <ContextMenu.ItemIcon
            ios={{
              name: "checkmark",
            }}
          />
        </ContextMenu.Item>

        {feedId && view !== undefined && (
          <ContextMenu.Item
            key="Star"
            onSelect={() => {
              if (isEntryStarred) {
                collectionSyncService.unstarEntry(id)
                toast.info("Unstarred")
              } else {
                collectionSyncService.starEntry({
                  feedId,
                  entryId: id,
                  view,
                })
                toast.info("Starred")
              }
            }}
          >
            <ContextMenu.ItemIcon
              ios={{
                name: isEntryStarred ? "star.slash" : "star",
              }}
            />
            <ContextMenu.ItemTitle>
              {isEntryStarred ? t("operation.unstar") : t("operation.star")}
            </ContextMenu.ItemTitle>
          </ContextMenu.Item>
        )}

        {entry.url && (
          <ContextMenu.Item
            key="OpenLink"
            onSelect={() => {
              if (!entry.url) return
              openLink(entry.url)
            }}
          >
            <ContextMenu.ItemIcon
              ios={{
                name: "link",
              }}
            />
            <ContextMenu.ItemTitle>{t("operation.open_link")}</ContextMenu.ItemTitle>
          </ContextMenu.Item>
        )}

        {entry.url && (
          <ContextMenu.Item
            key="Share"
            onSelect={async () => {
              if (!entry.url) return
              await Share.share({
                message: entry.url,
                url: entry.url,
                title: entry.title || "Shared Link",
              })
            }}
          >
            <ContextMenu.ItemIcon
              ios={{
                name: "square.and.arrow.up",
              }}
            />
            <ContextMenu.ItemTitle>{t("operation.share")}</ContextMenu.ItemTitle>
          </ContextMenu.Item>
        )}
      </ContextMenu.Content>
    </ContextMenu.Root>
  )
}
