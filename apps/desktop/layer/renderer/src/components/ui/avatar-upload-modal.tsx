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
      const size = Math.min(img.naturalWidth, img.naturalHeight) * 0.8
      setCropData({
        x: (img.naturalWidth - size) / 2,
        y: (img.naturalHeight - size) / 2,
        width: size,
        height: size,
      })
    }
  }, [])

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
      const rect = containerRef.current.getBoundingClientRect()
      const scaleX = img.naturalWidth / rect.width
      const scaleY = img.naturalHeight / rect.height

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

        const size = Math.max(newWidth, newHeight)

        if (resizeHandle.includes("t")) newY = cropY + cropHeight - size
        if (resizeHandle.includes("l")) newX = cropX + cropWidth - size

        newWidth = size
        newHeight = size

        // Boundary checks
        if (newWidth < 50) newWidth = 50
        if (newHeight < 50) newHeight = 50

        if (newX < 0) {
          newWidth += newX
          newX = 0
        }
        if (newY < 0) {
          newHeight += newY
          newY = 0
        }

        if (newX + newWidth > img.naturalWidth) {
          newWidth = img.naturalWidth - newX
        }
        if (newY + newHeight > img.naturalHeight) {
          newHeight = img.naturalHeight - newY
        }

        const finalSize = Math.min(newWidth, newHeight)

        setCropData({
          width: finalSize,
          height: finalSize,
          x: resizeHandle.includes("l") ? newX + (newWidth - finalSize) : newX,
          y: resizeHandle.includes("t") ? newY + (newHeight - finalSize) : newY,
        })
      } else if (isDragging) {
        const newX = dragStart.cropX + deltaX * scaleX
        const newY = dragStart.cropY + deltaY * scaleY

        setCropData((prev) => ({
          ...prev,
          x: Math.max(0, Math.min(newX, img.naturalWidth - prev.width)),
          y: Math.max(0, Math.min(newY, img.naturalHeight - prev.height)),
        }))
      }
    },
    [isDragging, resizeHandle, dragStart],
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
    if (!imageRef.current) return {}
    const img = imageRef.current
    return {
      left: `${(cropData.x / img.naturalWidth) * 100}%`,
      top: `${(cropData.y / img.naturalHeight) * 100}%`,
      width: `${(cropData.width / img.naturalWidth) * 100}%`,
      height: `${(cropData.height / img.naturalHeight) * 100}%`,
    }
  }, [cropData])

  return (
    <div className="flex flex-col gap-4">
      {!selectedImage ? (
        <div className="aspect-square h-[400px] space-y-4">
          <DropZone onDrop={handleFileSelect} className="size-full">
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

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          {t("words.cancel", { ns: "common" })}
        </Button>
        <Button onClick={handleConfirm} disabled={!selectedImage} isLoading={isProcessing}>
          {t("words.confirm", { ns: "common" })}
        </Button>
      </div>
    </div>
  )
}
