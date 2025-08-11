import { Button } from "@follow/components/ui/button/index.js"
import { DropZone } from "@follow/components/ui/drop-zone/index.js"
import { useCallback, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

interface AvatarUploadModalProps {
  onConfirm: (blob: Blob) => Promise<void>
  onCancel: () => void
  maxSizeKB?: number
}

export const AvatarUploadModal = ({
  onConfirm,
  onCancel,
  maxSizeKB = 300,
}: AvatarUploadModalProps) => {
  const { t } = useTranslation("settings")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Crop settings
  const [cropData, setCropData] = useState({
    x: 0,
    y: 0,
    width: 400,
    height: 400,
  })
  const [isDragging, setIsDragging] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState({
    x: 0,
    y: 0,
    cropX: 0,
    cropY: 0,
    cropWidth: 0,
    cropHeight: 0,
  })

  // Helper function: ensure the crop data is within the image boundaries and maintain the 1:1 ratio
  const constrainCropData = useCallback(
    (newCropData: typeof cropData, imageWidth: number, imageHeight: number) => {
      const { x, y, width, height } = newCropData

      // Ensure it's a square, use the larger value to avoid shrinking
      const size = Math.max(width, height)

      // Ensure the minimum size
      const minSize = 50
      let finalSize = Math.max(size, minSize)

      // Ensure it's not out of bounds, if it is, shrink it to the appropriate size
      const maxSize = Math.min(imageWidth, imageHeight)
      finalSize = Math.min(finalSize, maxSize)

      // Adjust the position to ensure it's within the boundaries
      const maxX = imageWidth - finalSize
      const maxY = imageHeight - finalSize

      return {
        x: Math.max(0, Math.min(x, maxX)),
        y: Math.max(0, Math.min(y, maxY)),
        width: finalSize,
        height: finalSize,
      }
    },
    [],
  )

  const handleFileSelect = useCallback(
    (files: FileList) => {
      const file = files[0]
      if (!file) return

      if (!file.type.startsWith("image/")) {
        toast.error(t("profile.avatar.invalidFileType"))
        return
      }

      if (file.size > maxSizeKB * 1024) {
        toast.error(t("profile.avatar.fileTooLarge", { size: `${maxSizeKB}KB` }))
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setSelectedImage(result)
      }
      reader.readAsDataURL(file)
    },
    [maxSizeKB, t],
  )

  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      const img = imageRef.current
      // Use the smaller side's 80% as the initial size
      const maxSize = Math.min(img.naturalWidth, img.naturalHeight)
      const size = maxSize * 0.8

      const initialCropData = {
        x: (img.naturalWidth - size) / 2,
        y: (img.naturalHeight - size) / 2,
        width: size,
        height: size,
      }
      // Use the helper function to ensure the data is valid
      const constrainedData = constrainCropData(
        initialCropData,
        img.naturalWidth,
        img.naturalHeight,
      )
      setCropData(constrainedData)
    }
  }, [constrainCropData])

  const handleCropMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        cropX: cropData.x,
        cropY: cropData.y,
        cropWidth: cropData.width,
        cropHeight: cropData.height,
      })
    },
    [cropData],
  )

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, handle: string) => {
      e.preventDefault()
      e.stopPropagation()
      setResizeHandle(handle)
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        cropX: cropData.x,
        cropY: cropData.y,
        cropWidth: cropData.width,
        cropHeight: cropData.height,
      })
    },
    [cropData],
  )

  const handleCropMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging && !resizeHandle) return
      e.preventDefault()

      if (!imageRef.current || !containerRef.current) return

      const img = imageRef.current
      const container = containerRef.current
      const containerRect = container.getBoundingClientRect()

      // Calculate the actual display size and position of the image in the container
      const containerWidth = containerRect.width
      const containerHeight = containerRect.height
      const imageAspectRatio = img.naturalWidth / img.naturalHeight
      const containerAspectRatio = containerWidth / containerHeight

      let displayWidth = 0,
        displayHeight = 0

      if (imageAspectRatio > containerAspectRatio) {
        // The image is wider, use the container width
        displayWidth = containerWidth
        displayHeight = containerWidth / imageAspectRatio
      } else {
        // The image is taller, use the container height
        displayHeight = containerHeight
        displayWidth = containerHeight * imageAspectRatio
      }

      const scaleX = img.naturalWidth / displayWidth
      const scaleY = img.naturalHeight / displayHeight

      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y

      if (resizeHandle) {
        const { cropX, cropY, cropWidth, cropHeight } = dragStart
        let newX = cropX
        let newY = cropY
        let newWidth = cropWidth
        let newHeight = cropHeight

        if (resizeHandle.includes("r")) newWidth += deltaX * scaleX
        if (resizeHandle.includes("l")) {
          newWidth -= deltaX * scaleX
          newX += deltaX * scaleX
        }
        if (resizeHandle.includes("b")) newHeight += deltaY * scaleY
        if (resizeHandle.includes("t")) {
          newHeight -= deltaY * scaleY
          newY += deltaY * scaleY
        }

        // Keep the aspect ratio, use the larger change value
        const size = Math.max(newWidth, newHeight)

        // Update the coordinates based on the position of the resize handle
        if (resizeHandle.includes("t")) newY = cropY + cropHeight - size
        if (resizeHandle.includes("l")) newX = cropX + cropWidth - size

        const newCropData = {
          x: newX,
          y: newY,
          width: size,
          height: size,
        }

        // Use the helper function to ensure the data is valid
        const constrainedData = constrainCropData(newCropData, img.naturalWidth, img.naturalHeight)
        setCropData(constrainedData)
      } else if (isDragging) {
        const newX = dragStart.cropX + deltaX * scaleX
        const newY = dragStart.cropY + deltaY * scaleY

        setCropData((prev) => {
          const newCropData = {
            ...prev,
            x: newX,
            y: newY,
          }
          return constrainCropData(newCropData, img.naturalWidth, img.naturalHeight)
        })
      }
    },
    [isDragging, resizeHandle, dragStart, constrainCropData],
  )

  const handleCropMouseUp = useCallback(() => {
    setIsDragging(false)
    setResizeHandle(null)
  }, [])

  const cropImage = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!imageRef.current || !canvasRef.current) {
        reject(new Error("Image or canvas not available"))
        return
      }

      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Canvas context not available"))
        return
      }

      const img = imageRef.current
      canvas.width = 400
      canvas.height = 400

      ctx.drawImage(img, cropData.x, cropData.y, cropData.width, cropData.height, 0, 0, 400, 400)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error("Failed to create blob"))
          }
        },
        "image/jpeg",
        0.9,
      )
    })
  }, [cropData])

  // Preset functions
  const handleFullImageCrop = useCallback(() => {
    if (!imageRef.current) return

    const img = imageRef.current
    const size = Math.min(img.naturalWidth, img.naturalHeight)

    const newCropData = {
      x: (img.naturalWidth - size) / 2,
      y: (img.naturalHeight - size) / 2,
      width: size,
      height: size,
    }

    const constrainedData = constrainCropData(newCropData, img.naturalWidth, img.naturalHeight)
    setCropData(constrainedData)
  }, [constrainCropData])

  const handleCenterCrop = useCallback(() => {
    if (!imageRef.current) return

    const img = imageRef.current
    const maxSize = Math.min(img.naturalWidth, img.naturalHeight)
    const size = maxSize * 0.8

    const newCropData = {
      x: (img.naturalWidth - size) / 2,
      y: (img.naturalHeight - size) / 2,
      width: size,
      height: size,
    }

    const constrainedData = constrainCropData(newCropData, img.naturalWidth, img.naturalHeight)
    setCropData(constrainedData)
  }, [constrainCropData])

  const handleConfirm = useCallback(async () => {
    if (!selectedImage) return

    try {
      setIsProcessing(true)
      const blob = await cropImage()
      await onConfirm(blob)
    } catch (error) {
      console.error("Error processing image:", error)
      toast.error(t("profile.avatar.processingError"))
    } finally {
      setIsProcessing(false)
    }
  }, [selectedImage, cropImage, onConfirm, t])

  const cropStyle = useMemo(() => {
    if (!imageRef.current || !containerRef.current) return {}

    const img = imageRef.current
    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()

    // Calculate the actual display size and position of the image in the container
    const containerWidth = containerRect.width
    const containerHeight = containerRect.height
    const imageAspectRatio = img.naturalWidth / img.naturalHeight
    const containerAspectRatio = containerWidth / containerHeight

    let displayWidth = 0,
      displayHeight = 0,
      offsetX = 0,
      offsetY = 0

    if (imageAspectRatio > containerAspectRatio) {
      // The image is wider, use the container width
      displayWidth = containerWidth
      displayHeight = containerWidth / imageAspectRatio
      offsetX = 0
      offsetY = (containerHeight - displayHeight) / 2
    } else {
      // The image is taller, use the container height
      displayHeight = containerHeight
      displayWidth = containerHeight * imageAspectRatio
      offsetX = (containerWidth - displayWidth) / 2
      offsetY = 0
    }

    // Calculate the scale ratio
    const scaleX = displayWidth / img.naturalWidth
    const scaleY = displayHeight / img.naturalHeight

    return {
      left: `${offsetX + cropData.x * scaleX}px`,
      top: `${offsetY + cropData.y * scaleY}px`,
      width: `${cropData.width * scaleX}px`,
      height: `${cropData.height * scaleY}px`,
    }
  }, [cropData])

  return (
    <div className="flex flex-col gap-4">
      {!selectedImage ? (
        <div className="aspect-square h-[400px] space-y-4">
          <DropZone
            id="upload-avatar"
            onDrop={handleFileSelect}
            accept="image/*"
            className="size-full"
          >
            <div className="flex flex-col items-center gap-2 p-8">
              <i className="i-mgc-file-upload-cute-re text-text-secondary text-4xl" />
              <div className="text-center">
                <p className="text-sm font-medium">{t("profile.avatar.dropZoneText")}</p>
                <p className="text-text-secondary text-xs">{t("profile.avatar.dropZoneSubtext")}</p>
              </div>
            </div>
          </DropZone>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            ref={containerRef}
            className="relative mx-auto size-[400px] select-none overflow-hidden rounded-lg border bg-gray-100 dark:bg-zinc-800"
            onMouseMove={handleCropMouseMove}
            onMouseUp={handleCropMouseUp}
            onMouseLeave={handleCropMouseUp}
          >
            <img
              ref={imageRef}
              src={selectedImage}
              alt="Preview"
              className="size-full object-contain"
              draggable={false}
              onLoad={handleImageLoad}
            />

            {/* Crop overlay */}
            <div
              className="absolute rounded-full"
              style={{
                ...cropStyle,
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.3)",
              }}
            />
            <div
              className="absolute"
              style={{
                ...cropStyle,
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.3)",
              }}
            >
              <div className="size-full cursor-move" onMouseDown={handleCropMouseDown}>
                {/* Grid lines */}
                <div className="bg-material-medium-light absolute left-1/3 top-0 h-full w-px" />
                <div className="bg-material-medium-light absolute left-2/3 top-0 h-full w-px" />
                <div className="bg-material-medium-light absolute left-0 top-1/3 h-px w-full" />
                <div className="bg-material-medium-light absolute left-0 top-2/3 h-px w-full" />

                {/* Resize handles */}
                <div
                  className="bg-accent absolute -left-1 -top-1 size-3 cursor-nwse-resize rounded-full border-2 border-white"
                  onMouseDown={(e) => handleResizeMouseDown(e, "tl")}
                />
                <div
                  className="bg-accent absolute -right-1 -top-1 size-3 cursor-nesw-resize rounded-full border-2 border-white"
                  onMouseDown={(e) => handleResizeMouseDown(e, "tr")}
                />
                <div
                  className="bg-accent absolute -bottom-1 -left-1 size-3 cursor-nesw-resize rounded-full border-2 border-white"
                  onMouseDown={(e) => handleResizeMouseDown(e, "bl")}
                />
                <div
                  className="bg-accent absolute -bottom-1 -right-1 size-3 cursor-nwse-resize rounded-full border-2 border-white"
                  onMouseDown={(e) => handleResizeMouseDown(e, "br")}
                />
              </div>
            </div>
          </div>

          <div className="text-text-secondary text-center text-sm">
            {t("profile.avatar.cropInstructions")}
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex justify-between gap-2">
        {selectedImage ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleFullImageCrop} size="sm">
              <i className="i-mgc-fullscreen-cute-re mr-1 text-sm" />
              Full Image
            </Button>
            <Button variant="outline" onClick={handleCenterCrop} size="sm">
              <i className="i-mgc-round-cute-re mr-1 text-sm" />
              Center Crop
            </Button>
          </div>
        ) : (
          <div className="flex-1" />
        )}
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            {t("words.cancel", { ns: "common" })}
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedImage} isLoading={isProcessing}>
            {t("words.confirm", { ns: "common" })}
          </Button>
        </div>
      </div>
    </div>
  )
}
