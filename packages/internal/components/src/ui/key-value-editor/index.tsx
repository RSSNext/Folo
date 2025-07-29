import { Button } from "@follow/components/ui/button/index.js"
import { Input } from "@follow/components/ui/input/index.js"
import { cn } from "@follow/utils/utils"
import { useCallback, useEffect, useRef, useState } from "react"

export interface KeyValuePair {
  key: string
  value: string
}

export interface KeyValueEditorProps {
  value?: Record<string, string>
  onChange?: (data: Record<string, string>) => void
  className?: string
  keyPlaceholder?: string
  valuePlaceholder?: string
  addButtonText?: string
  minRows?: number
  disabled?: boolean
}

const emptyObject = {} as Record<string, string>

export const KeyValueEditor = ({
  value = emptyObject,
  onChange,
  className,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
  addButtonText = "Add Row",
  minRows = 1,
  disabled = false,
}: KeyValueEditorProps) => {
  // Internal state for key-value pairs array
  const [pairs, setPairs] = useState<KeyValuePair[]>(() => {
    const entries = Object.entries(value)
    return entries.length > 0
      ? entries.map(([key, val]) => ({ key, value: val }))
      : Array.from({ length: minRows }, () => ({ key: "", value: "" }))
  })

  // Track if we're in the middle of an internal update to avoid sync conflicts
  const isInternalUpdateRef = useRef(false)
  const lastExternalValueRef = useRef(value)

  // Sync external value changes to internal state
  useEffect(() => {
    // Skip sync if this change originated from internal update
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false
      return
    }

    // Skip if external value hasn't actually changed
    if (JSON.stringify(value) === JSON.stringify(lastExternalValueRef.current)) {
      return
    }

    lastExternalValueRef.current = value

    const entries = Object.entries(value)
    const newPairs =
      entries.length > 0
        ? entries.map(([key, val]) => ({ key, value: val }))
        : Array.from({ length: minRows }, () => ({ key: "", value: "" }))

    setPairs(newPairs)
  }, [value, minRows])

  // Convert pairs array to object and notify parent
  const notifyChange = useCallback(
    (newPairs: KeyValuePair[]) => {
      if (!onChange) return

      const dataObject = newPairs.reduce(
        (acc, { key, value }) => {
          if (key.trim() && value.trim()) {
            acc[key.trim()] = value.trim()
          }
          return acc
        },
        {} as Record<string, string>,
      )

      // Mark this as an internal update to prevent sync conflicts
      isInternalUpdateRef.current = true
      lastExternalValueRef.current = dataObject
      onChange(dataObject)
    },
    [onChange],
  )

  const addPair = useCallback(() => {
    const newPairs = [...pairs, { key: "", value: "" }]
    setPairs(newPairs)
    notifyChange(newPairs)
  }, [pairs, notifyChange])

  const removePair = useCallback(
    (index: number) => {
      if (pairs.length <= minRows) return

      const newPairs = pairs.filter((_, i) => i !== index)
      setPairs(newPairs)
      notifyChange(newPairs)
    },
    [pairs, minRows, notifyChange],
  )

  const updatePair = useCallback(
    (index: number, field: "key" | "value", newValue: string) => {
      const newPairs = pairs.map((pair, i) => (i === index ? { ...pair, [field]: newValue } : pair))
      setPairs(newPairs)
      notifyChange(newPairs)
    },
    [pairs, notifyChange],
  )

  return (
    <div className={cn("space-y-2", className)}>
      {pairs.map((pair, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            placeholder={keyPlaceholder}
            value={pair.key}
            onChange={(e) => updatePair(index, "key", e.target.value)}
            className="flex-1"
            disabled={disabled}
          />
          <Input
            placeholder={valuePlaceholder}
            value={pair.value}
            onChange={(e) => updatePair(index, "value", e.target.value)}
            className="flex-1"
            disabled={disabled}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removePair(index)}
            disabled={disabled || pairs.length <= minRows}
            buttonClassName="size-8 shrink-0 p-0"
          >
            <i className="i-mgc-close-cute-re" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addPair}
        disabled={disabled}
        buttonClassName="w-full h-8"
      >
        <i className="i-mgc-add-cute-re mr-2" />
        {addButtonText}
      </Button>
    </div>
  )
}
