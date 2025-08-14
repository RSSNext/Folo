import { Input } from "@follow/components/ui/input/Input.js"
import { cn } from "@follow/utils/utils"
import { useCallback, useEffect, useState } from "react"

interface EditableTitleProps {
  title?: string
  onSave: (newTitle: string) => Promise<void>
  className?: string
  placeholder?: string
  maxLength?: number
}

export const EditableTitle = ({
  title = "",
  onSave,
  className,
  placeholder = "Untitled Chat",
  maxLength = 100,
}: EditableTitleProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [originalTitle, setOriginalTitle] = useState("")
  const [saveSuccess, setSaveSuccess] = useState(false)

  const displayTitle = title || placeholder

  const handleStartEdit = useCallback(() => {
    setOriginalTitle(title)
    setEditValue(title)
    setIsEditing(true)
  }, [title])

  const handleSave = useCallback(async () => {
    if (isSaving) return

    const trimmedValue = editValue.trim()

    // If no changes, just exit edit mode
    if (trimmedValue === originalTitle) {
      setIsEditing(false)
      return
    }

    try {
      setIsSaving(true)
      await onSave(trimmedValue)

      // Show success feedback briefly
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)

      setIsEditing(false)
    } catch (error) {
      console.error("Failed to save title:", error)
      // Keep in edit mode on error to allow retry
    } finally {
      setIsSaving(false)
    }
  }, [editValue, originalTitle, onSave, isSaving])

  const handleCancel = useCallback(() => {
    setEditValue(originalTitle)
    setIsEditing(false)
    setIsSaving(false)
  }, [originalTitle])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault()
        handleSave()
      } else if (event.key === "Escape") {
        event.preventDefault()
        handleCancel()
      }
    },
    [handleSave, handleCancel],
  )

  const handleBlur = useCallback(() => {
    if (!isSaving) {
      handleSave()
    }
  }, [handleSave, isSaving])

  // Auto-focus input when entering edit mode
  useEffect(() => {
    if (isEditing) {
      const input = document.activeElement as HTMLInputElement
      if (input?.select) {
        input.select()
      }
    }
  }, [isEditing])

  if (isEditing) {
    return (
      <div className="relative min-w-0 flex-1">
        <Input
          ref={(ref) => ref?.focus()}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          maxLength={maxLength}
          disabled={isSaving}
          className={cn(
            "text-text border-accent/50 focus:border-accent bg-transparent font-bold",
            "h-auto p-2 text-base leading-none",
            isSaving && "cursor-not-allowed opacity-60",
            className,
          )}
          placeholder={placeholder}
        />
        {isSaving && (
          <div className="animate-in fade-in zoom-in-75 absolute right-2 top-1/2 -translate-y-1/2 duration-200">
            <i className="i-mgc-loading-3-cute-re text-text-secondary size-4 animate-spin" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn("group flex min-w-0 flex-1 cursor-pointer items-center gap-2", className)}
      onClick={handleStartEdit}
    >
      <h1 className="text-text truncate font-bold transition-opacity group-hover:opacity-80">
        <span className="animate-mask-left-to-right [--animation-duration:1s]">{displayTitle}</span>
      </h1>
      {saveSuccess && (
        <i className="i-mgc-check-cute-re text-green animate-in fade-in zoom-in-50 size-4 transition-all duration-300" />
      )}
      <i className="i-mgc-edit-cute-re text-text-secondary group-hover:animate-in group-hover:fade-in group-hover:zoom-in-75 size-4 opacity-0 transition-all duration-150 hover:opacity-100 group-hover:opacity-60" />
    </div>
  )
}
