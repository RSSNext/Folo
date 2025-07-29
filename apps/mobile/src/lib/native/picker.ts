import * as FileSystem from "expo-file-system"
import * as ImageManipulator from "expo-image-manipulator"
import * as ImagePicker from "expo-image-picker"

export const pickImage = async (
  options?: ImagePicker.ImagePickerOptions & {
    fileName?: string
    maxSizeKB?: number
  },
) => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
    ...options,
  })

  if (result.assets?.[0]) {
    let image = result.assets[0]

    if (options?.maxSizeKB) {
      const maxSizeKB = options?.maxSizeKB
      image = await compressImage(image, maxSizeKB)
    }

    const formData = new FormData()
    formData.append("file", {
      uri: image.uri,
      type: image.mimeType || "application/octet-stream",
      name: options?.fileName ?? image.fileName ?? "untitled.jpg",
    } as any)

    return {
      formData,
      image,
    }
  }
  return null
}

async function compressImage(
  image: ImagePicker.ImagePickerAsset,
  maxSizeKB: number,
): Promise<ImagePicker.ImagePickerAsset> {
  const fileInfo = await FileSystem.getInfoAsync(image.uri)

  // If the file size is already less than the max size, return the image
  if (fileInfo.exists && fileInfo.size !== undefined && fileInfo.size / 1024 <= maxSizeKB) {
    return image
  }

  let quality = 0.9
  let compressedImage = image
  let fileSize = fileInfo.exists ? fileInfo.size || 0 : 0

  // Loop until the file size is less than the max size
  while (fileSize / 1024 > maxSizeKB && quality > 0.1) {
    // Compress the image
    const manipResult = await ImageManipulator.manipulateAsync(
      compressedImage.uri,
      [], // Do not change the size
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG },
    )

    // Update the compressed image and file information
    compressedImage = {
      ...compressedImage,
      uri: manipResult.uri,
      mimeType: "image/jpeg",
    }

    const newFileInfo = await FileSystem.getInfoAsync(manipResult.uri)
    fileSize = newFileInfo.exists ? newFileInfo.size || 0 : 0

    // Lower the quality for the next compression
    quality -= 0.1
  }

  return compressedImage
}
