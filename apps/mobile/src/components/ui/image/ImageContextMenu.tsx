import type { FeedViewType } from "@follow/constants"
import { useIsEntryStarred } from "@follow/store/collection/hooks"
import { collectionSyncService } from "@follow/store/collection/store"
import { useEntry } from "@follow/store/entry/hooks"
import { unreadSyncService } from "@follow/store/unread/store"
import { requireNativeModule } from "expo"
import type { PropsWithChildren } from "react"
import { useRef } from "react"
import { useTranslation } from "react-i18next"
import type { View } from "react-native"
import { findNodeHandle, Pressable } from "react-native"

import { isIOS } from "@/src/lib/platform"
import { toast } from "@/src/lib/toast"

import { ContextMenu } from "../context-menu"
import { shareImage, useSaveImageToMediaLibrary } from "./utils"

type ImageContextMenuProps = PropsWithChildren<{
  imageUrl?: string
  entryId?: string
  view?: FeedViewType
}>

interface IOSNativeImageActions {
  saveImageByHandle: (handle: number) => void
  shareImageByHandle: (handle: number, url: string) => void
  getBase64FromImageViewByHandle: (handle: number) => Promise<{ base64: string }>
  copyImageByHandle: (handle: number) => void
}

const getIOSNativeImageActions = () => {
  return requireNativeModule<IOSNativeImageActions>("Helper")
}

export const ImageContextMenu = ({ imageUrl, entryId, children, view }: ImageContextMenuProps) => {
  const { t } = useTranslation()
  const entry = useEntry(entryId, (state) => ({
    read: state.read,
    feedId: state.feedId,
  }))
  const feedId = entry?.feedId

  const isEntryStarred = useIsEntryStarred(entryId!)

  const contextMenuTriggerRef = useRef<View>(null)
  const saveImageToAlbum = useSaveImageToMediaLibrary()

  if (!imageUrl || !entry) {
    return children
  }

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        {/* Must wrap a NOT <View /> Component, because <View />'s handle can found native view in native. May be this is a react native bug */}
        <Pressable ref={contextMenuTriggerRef}>{children}</Pressable>
      </ContextMenu.Trigger>

      <ContextMenu.Content>
        {entryId && feedId && view !== undefined && (
          <>
            <ContextMenu.Item
              key="MarkAsRead"
              onSelect={() => {
                entry.read
                  ? unreadSyncService.markEntryAsUnread(entryId)
                  : unreadSyncService.markEntryAsRead(entryId)
              }}
            >
              <ContextMenu.ItemTitle>
                {entry.read ? t("operation.mark_as_unread") : t("operation.mark_as_read")}
              </ContextMenu.ItemTitle>
              <ContextMenu.ItemIcon
                ios={{
                  name: entry.read ? "circle.fill" : "checkmark.circle",
                }}
              />
            </ContextMenu.Item>
            <ContextMenu.Item
              key="Star"
              onSelect={() => {
                if (isEntryStarred) {
                  collectionSyncService.unstarEntry({ entryId })
                  toast.success("Unstarred")
                } else {
                  collectionSyncService.starEntry({
                    entryId,
                    view,
                  })
                  toast.success("Starred")
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
          </>
        )}

        <ContextMenu.Item
          key="Save"
          onSelect={async () => {
            if (isIOS) {
              const handle = findNodeHandle(contextMenuTriggerRef.current)

              if (!handle) {
                return
              }
              getIOSNativeImageActions().saveImageByHandle(handle)
            } else {
              saveImageToAlbum(imageUrl)
            }
          }}
        >
          <ContextMenu.ItemTitle>Save to Album</ContextMenu.ItemTitle>
          <ContextMenu.ItemIcon
            ios={{
              name: "square.and.arrow.down",
            }}
          />
        </ContextMenu.Item>
        <ContextMenu.Item
          key="Share"
          onSelect={async () => {
            if (isIOS) {
              const handle = findNodeHandle(contextMenuTriggerRef.current)

              if (!handle) {
                return
              }
              getIOSNativeImageActions().shareImageByHandle(handle, imageUrl)
            } else {
              shareImage({ uri: imageUrl })
            }
          }}
        >
          <ContextMenu.ItemIcon
            ios={{
              name: "square.and.arrow.up",
            }}
          />
          <ContextMenu.ItemTitle>{t("operation.share")}</ContextMenu.ItemTitle>
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  )
}
