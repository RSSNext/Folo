import { cn } from "@follow/utils/utils"
import type { DragEvent, ReactNode } from "react"
import { useCallback, useId, useRef, useState } from "react"

// Ported from https://github.com/react-dropzone/react-dropzone/issues/753#issuecomment-774782919
const useDragAndDrop = ({ callback }: { callback: (file: FileList) => void | Promise<void> }) => {
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)

  const onDrop = useCallback(
    async (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault()
      setIsDragging(false)
      if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
        dragCounter.current = 0
        await callback(event.dataTransfer.files)
        event.dataTransfer.clearData()
      }
    },
    [callback],
  )

  const onDragEnter = useCallback((event: DragEvent) => {
    event.preventDefault()
    dragCounter.current++
    setIsDragging(true)
  }, [])

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault()
  }, [])

  const onDragLeave = useCallback((event: DragEvent) => {
    event.preventDefault()
    dragCounter.current--
    if (dragCounter.current > 0) return
    setIsDragging(false)
  }, [])

  return {
    isDragging,

    dragHandlers: {
      onDrop,
      onDragOver,
      onDragEnter,
      onDragLeave,
    },
  }
}

export const DropZone = ({
  onDrop,
  children,
  className,
}: {
  onDrop: (file: FileList) => void | Promise<void>
  className?: string
  children?: ReactNode
}) => {
  const { isDragging, dragHandlers } = useDragAndDrop({ callback: onDrop })

  const id = useId()
  return (
    <label
      className={cn(
        "center flex h-[100px] w-full cursor-pointer rounded-md border border-dashed",
        isDragging ? "border-accent bg-accent/10" : "",
        "hover:border-accent/50 duration-200",
        className,
      )}
      htmlFor={id}
      {...dragHandlers}
    >
      {children}
      <input
        id={id}
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files && onDrop(e.target.files)}
        className="hidden"
      />
    </label>
  )
}
