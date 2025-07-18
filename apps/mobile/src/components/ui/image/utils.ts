import { createBuildSafeHeaders } from "@follow/utils/headers"
import { getImageProxyUrl, IMAGE_PROXY_URL } from "@follow/utils/img-proxy"
import ImageEditor from "@react-native-community/image-editor"
import * as FileSystem from "expo-file-system"
import type { ImageProps, ImageSource } from "expo-image"
import { saveToLibraryAsync, usePermissions } from "expo-media-library"
import * as Sharing from "expo-sharing"
import { useCallback } from "react"
import { Image } from "react-native"

import { isAndroid, isNative } from "@/src/lib/platform"
import { proxyEnv } from "@/src/lib/proxy-env"
import { toast } from "@/src/lib/toast"

const buildSafeHeaders = createBuildSafeHeaders(proxyEnv.WEB_URL, [
  IMAGE_PROXY_URL,
  proxyEnv.API_URL,
])

// Type guard to check if source is an ImageSource with uri property
function isImageSourceWithUri(
  source: ImageProps["source"],
): source is ImageSource & { uri: string } {
  return (
    source !== null &&
    typeof source === "object" &&
    !Array.isArray(source) &&
    "uri" in source &&
    typeof source.uri === "string"
  )
}

export const getAllSources = (
  source: ImageProps["source"],
  proxy?: {
    width?: number
    height?: number
  },
) => {
  if (!isImageSourceWithUri(source)) {
    console.warn("Invalid image source", source)
    return [undefined, undefined] as const
  }

  // Now TypeScript knows source has a uri property
  source.uri = source.uri.replace("http://", "https://")

  const safeSource: ImageProps["source"] = {
    width: proxy?.width,
    height: proxy?.height,
    ...source,
    headers: {
      ...buildSafeHeaders({ url: source.uri }),
      ...source.headers,
    },
  }

  const proxiesSafeSource = (() => {
    if (!proxy?.height && !proxy?.width) {
      return safeSource
    }

    return {
      width: proxy?.width,
      height: proxy?.height,
      ...safeSource,
      uri: getImageProxyUrl({
        url: source.uri,
        width: proxy?.width ? proxy?.width * 3 : undefined,
        height: proxy?.height ? proxy?.height * 3 : undefined,
      }),
    } satisfies ImageProps["source"]
  })()

  return [safeSource, proxiesSafeSource] as const
}

const getImageData = async (imageUrl: string) => {
  let size = await Image.getSize(imageUrl)

  // Workaround for Android where the size returned by Image.getSize is not accurate for remote images
  // Learn more https://github.com/facebook/react-native/issues/33498
  if (isAndroid) {
    size = {
      width: size.width * 10,
      height: size.height * 10,
    }
  }

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

const createTempFile = async (base64: string, filename: string) => {
  if (!FileSystem.cacheDirectory) {
    throw new Error("Cache directory is not available")
  }
  const fileUri = await FileSystem.getInfoAsync(FileSystem.cacheDirectory)
  const filePath = `${fileUri.uri}/${filename}`
  await FileSystem.writeAsStringAsync(filePath, base64, {
    encoding: FileSystem.EncodingType.Base64,
  })

  return {
    filePath,
    cleanup: () => FileSystem.deleteAsync(filePath),
  }
}

export function extractFilenameFromUrl(uri: string): string {
  // Extract actual filename from URL, removing any query parameters
  const urlWithoutParams = uri.split(/[?#]/).at(0)
  const lastSegment = urlWithoutParams?.split("/").pop() || "image"
  return lastSegment
}

export async function shareImage({ uri }: { uri: string }) {
  if (!(await Sharing.isAvailableAsync())) {
    // TODO might need to give an error to the user in this case -prf
    return
  }
  const croppedImage = await getImageData(uri)
  const filename = `${extractFilenameFromUrl(uri)}.png`

  const { filePath, cleanup } = await createTempFile(croppedImage.base64, filename)
  await Sharing.shareAsync(filePath, {
    mimeType: "image/png",
    dialogTitle: "Share Image",
  })

  cleanup()
}

export const saveImageToMediaLibrary = async ({ uri }: { uri: string }) => {
  const croppedImage = await getImageData(uri)
  const filename = `${extractFilenameFromUrl(uri)}.png`
  const { filePath, cleanup } = await createTempFile(croppedImage.base64, filename)
  await saveToLibraryAsync(filePath)
  cleanup()
}

/**
 * Same as `saveImageToMediaLibrary`, but also handles permissions and toasts
 *
 * Ported from https://github.com/bluesky-social/social-app/blob/a0ea634349fd7eac40d72dbd57339f1d6c53a117/src/lib/media/save-image.ts
 *
 * @example
 * ```ts
 * const saveImageToAlbum = useSaveImageToMediaLibrary()
 * ```
 */
export function useSaveImageToMediaLibrary() {
  const [permissionResponse, requestPermission, getPermission] = usePermissions({
    granularPermissions: ["photo"],
  })
  return useCallback(
    async (uri: string) => {
      if (!isNative) {
        throw new Error("useSaveImageToMediaLibrary is native only")
      }

      async function save() {
        try {
          await saveImageToMediaLibrary({ uri })
          toast.success("Image saved to library")
        } catch (e) {
          toast.error(`Failed to save image: ${String(e)}`)
        }
      }

      const permission = permissionResponse ?? (await getPermission())

      if (permission.granted) {
        await save()
      } else {
        if (permission.canAskAgain) {
          // request again once
          const askAgain = await requestPermission()
          if (askAgain.granted) {
            await save()
          } else {
            // since we've been explicitly denied, show a toast.
            toast.error(
              `Images cannot be saved unless permission is granted to access your photo library.`,
              {
                duration: 5000,
              },
            )
          }
        } else {
          toast.info(
            `Permission to access your photo library was denied. Please enable it in your system settings.`,
            {
              duration: 5000,
            },
          )
        }
      }
    },
    [permissionResponse, requestPermission, getPermission],
  )
}
