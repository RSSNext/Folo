import { cn } from "@follow/utils"
import clsx from "clsx"
import type { EditorState, LexicalEditor } from "lexical"
import { $getRoot } from "lexical"
import { useMotionValue } from "motion/react"
import { useCallback, useMemo, useRef, useState } from "react"

import { LexicalRichEditor } from "./LexicalRichEditor"
import type { LexicalRichEditorProps, LexicalRichEditorRef } from "./types"
import { getEditorStateJSONString } from "./utils"

interface LexicalRichEditorTextAreaProps extends Omit<LexicalRichEditorProps, "initalEditorState"> {
  /**
   * Initial value can be:
   * - JSON string (serialized EditorState)
   * - Plain text (will be converted to EditorState)
   */
  initialValue?: string
  /**
   * Callback when editor content changes
   * @param serializedState - JSON string of the editor state
   * @param textLength - Length of plain text content
   */
  onValueChange?: (serializedState: string, textLength: number) => void
  /**
   * Callback when editor is ready
   */
  onEditorReady?: (editor: LexicalEditor) => void
  /**
   * Wrapper class name for the outer container
   */
  wrapperClassName?: string
  /**
   * Border radius style
   */
  rounded?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "default"
  /**
   * Whether to show border
   */
  bordered?: boolean
}

const roundedMap = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
  default: "rounded",
}

export const LexicalRichEditorTextArea = ({
  initialValue,
  onChange,
  onValueChange,
  onEditorReady,
  wrapperClassName,
  rounded = "lg",
  bordered = true,
  className,
  ...restProps
}: LexicalRichEditorTextAreaProps) => {
  const editorRef = useRef<LexicalRichEditorRef | null>(null)
  const [isFocus, setIsFocus] = useState(false)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const handleMouseMove = useCallback(
    ({ clientX, clientY, currentTarget }: React.MouseEvent) => {
      const bounds = currentTarget.getBoundingClientRect()
      mouseX.set(clientX - bounds.left)
      mouseY.set(clientY - bounds.top)
    },
    [mouseX, mouseY],
  )

  // Create initial editor state from saved value
  const initialEditorState = useMemo(() => {
    if (!initialValue) return null

    // Try to parse as JSON state first
    try {
      JSON.parse(initialValue)
      // If successful, it's already a JSON state
      return initialValue
    } catch {
      // If parsing fails, it's plain text, convert it
      return getEditorStateJSONString(initialValue)
    }
  }, [initialValue])

  const handleEditorChange = useCallback(
    (editorState: EditorState, editor: LexicalEditor) => {
      // Call original onChange if provided
      onChange?.(editorState, editor)

      // Call onValueChange if provided
      if (onValueChange) {
        editorState.read(() => {
          const root = $getRoot()
          const textContent = root.getTextContent()
          const { length } = textContent

          // Notify parent with serialized state
          const serializedState = JSON.stringify(editorState.toJSON())
          onValueChange(serializedState, length)
        })
      }

      // Notify parent when editor is ready
      if (onEditorReady) {
        onEditorReady(editor)
      }
    },
    [onChange, onValueChange, onEditorReady],
  )

  return (
    <div
      className={cn(
        "ring-accent/20 group relative flex h-full border ring-0 duration-200",
        roundedMap[rounded],

        "hover:border-accent/60 border-transparent",
        isFocus && "!border-accent/80 ring-2",

        "placeholder:text-text-tertiary dark:text-zinc-200",
        "bg-theme-background dark:bg-zinc-700/[0.15]",

        "px-3 py-4",
        wrapperClassName,
      )}
      onMouseMove={handleMouseMove}
      onFocus={() => setIsFocus(true)}
      onBlur={() => setIsFocus(false)}
    >
      {bordered && (
        <div
          className={clsx(
            "border-border pointer-events-none absolute inset-0 z-0 border",
            roundedMap[rounded],
          )}
          aria-hidden="true"
        />
      )}
      <LexicalRichEditor
        ref={editorRef}
        {...restProps}
        className={cn(
          "size-full resize-none bg-transparent",
          "overflow-auto",
          "!outline-none",
          "text-text placeholder:text-text-tertiary",
          "focus:!bg-accent/5",
          roundedMap[rounded],
          className,
        )}
        onChange={handleEditorChange}
        initalEditorState={initialEditorState}
      />
    </div>
  )
}
