import { getEditorStateJSONString } from "@follow/components/ui/lexical-rich-editor/utils.js"
import { $createParagraphNode, $createTextNode, $getRoot, createEditor } from "lexical"
import { describe, expect, it } from "vitest"

import { isEditorStateUnchanged } from "./editor-state"

const createTestEditor = () =>
  createEditor({
    namespace: "editor-state-test",
    onError: (error) => {
      throw error
    },
  })

const storeMessageState = (text: string) => {
  const editor = createTestEditor()
  editor.update(
    () => {
      const paragraph = $createParagraphNode()
      paragraph.append($createTextNode(text))
      $getRoot().append(paragraph)
    },
    { discrete: true },
  )
  return JSON.stringify(editor.getEditorState().toJSON())
}

const openInEditor = (storedState: string) => {
  const editor = createTestEditor()
  editor.setEditorState(editor.parseEditorState(storedState))
  return editor
}

describe("isEditorStateUnchanged", () => {
  it("treats a message opened for editing and left alone as unchanged", () => {
    const storedState = storeMessageState("Say hello in three words.")
    const editor = openInEditor(storedState)

    expect(isEditorStateUnchanged(editor, storedState)).toBe(true)
  })

  it("treats a state stored from plain text as unchanged", () => {
    const storedState = getEditorStateJSONString("Summarize my timeline")
    const editor = openInEditor(storedState)

    expect(isEditorStateUnchanged(editor, storedState)).toBe(true)
  })

  it("detects an edited message", () => {
    const storedState = storeMessageState("Say hello in three words.")
    const editor = openInEditor(storedState)
    editor.update(
      () => {
        $getRoot().getFirstDescendant()?.replace($createTextNode("Say goodbye in three words."))
      },
      { discrete: true },
    )

    expect(isEditorStateUnchanged(editor, storedState)).toBe(false)
  })
})
