import type { FeedViewType } from "@follow/constants"
import { useIsEntryStarred } from "@follow/store/collection/hooks"
import { collectionSyncService } from "@follow/store/collection/store"
import { useEntry } from "@follow/store/entry/hooks"
import { unreadSyncService } from "@follow/store/unread/store"
import ImageEditor from "@react-native-community/image-editor"
import { requireNativeModule } from "expo"
import * as FileSystem from "expo-file-system"
import { saveToLibraryAsync } from "expo-media-library"
import { shareAsync } from "expo-sharing"
import type { PropsWithChildren } from "react"
import { useRef } from "react"
import { useTranslation } from "react-i18next"
import type { View } from "react-native"
import { findNodeHandle, Image, Pressable } from "react-native"

import { isIOS } from "@/src/lib/platform"
import { toast } from "@/src/lib/toast"

import { ContextMenu } from "../context-menu"

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
  const entry = useEntry(entryId!)
  const feedId = entry?.feedId

  const isEntryStarred = useIsEntryStarred(entryId!)

  const contextMenuTriggerRef = useRef<View>(null)

  if (!imageUrl || !entry) {
    return children
  }

  const getImageData = async () => {
    const size = await Image.getSize(imageUrl)
    const croppedImage = await ImageEditor.cropImage(imageUrl, {
      offset: {
        x: 0,
        y: 0,
      },
      size,
      format: "png",
      includeBase64: true,
    })

    return croppedImage
  }

  const createTempFile = async (base64: string) => {
    const fileUri = await FileSystem.getInfoAsync(FileSystem.cacheDirectory!)
    const filename = `${imageUrl.split("/").pop()}.png`
    const filePath = `${fileUri.uri}/${filename}`
    await FileSystem.writeAsStringAsync(filePath, base64, {
      encoding: FileSystem.EncodingType.Base64,
    })

    return {
      filePath,
      cleanup: () => FileSystem.deleteAsync(filePath),
    }
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
                  collectionSyncService.unstarEntry(entryId)
                  toast.success("Unstarred")
                } else {
                  collectionSyncService.starEntry({
                    feedId,
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
              const croppedImage = await getImageData()
              const { filePath, cleanup } = await createTempFile(croppedImage.base64)
              await saveToLibraryAsync(filePath)
              toast.success("Image saved to library")
              cleanup()
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
              const croppedImage = await getImageData()
              const { filePath, cleanup } = await createTempFile(croppedImage.base64)
              await shareAsync(filePath, {
                dialogTitle: "Share Image",
              })

              cleanup()
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
