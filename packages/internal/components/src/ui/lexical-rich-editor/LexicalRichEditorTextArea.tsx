import { cn, nextFrame } from "@follow/utils"
import type { EditorState, LexicalEditor } from "lexical"
import { $getRoot } from "lexical"
import { useCallback, useImperativeHandle, useMemo, useRef, useState } from "react"

import type { RoundedSize } from "../input/TextAreaWrapper"
import { roundedMap, TextAreaWrapper } from "../input/TextAreaWrapper"
import { ScrollArea } from "../scroll-area"
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
  rounded?: RoundedSize
  /**
   * Whether to show border
   */
  bordered?: boolean
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
  ref,
  ...restProps
}: LexicalRichEditorTextAreaProps & { ref?: React.RefObject<LexicalRichEditorRef | null> }) => {
  const editorRef = useRef<LexicalRichEditorRef | null>(null)
  const [isFocus, setIsFocus] = useState(false)

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

  useImperativeHandle(ref, () => editorRef.current!)

  const handlePointerDown = useCallback(() => {
    nextFrame(() => {
      editorRef.current?.getEditor().focus()
    })
  }, [editorRef])

  return (
    <TextAreaWrapper
      wrapperClassName={wrapperClassName}
      rounded={rounded}
      bordered={bordered}
      isFocused={isFocus}
      onFocusChange={setIsFocus}
      paddingClassName="p-0"
      onPointerDown={handlePointerDown}
    >
      <ScrollArea.ScrollArea rootClassName="size-full" viewportClassName="px-3 py-4">
        <LexicalRichEditor
          ref={editorRef}
          {...restProps}
          className={cn(
            "size-full resize-none bg-transparent",
            "!outline-none",
            "text-text",
            "focus:!bg-accent/5",
            roundedMap[rounded],
            className,
          )}
          onChange={handleEditorChange}
          initalEditorState={initialEditorState}
        />
      </ScrollArea.ScrollArea>
    </TextAreaWrapper>
  )
}
