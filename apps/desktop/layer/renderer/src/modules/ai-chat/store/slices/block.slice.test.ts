import { describe, expect, it } from "vitest"
import { createStore } from "zustand/vanilla"

import type { FileAttachment } from "../types"
import type { BlockSlice } from "./block.slice"
import { createBlockSlice } from "./block.slice"

const createAttachment = (id: string): FileAttachment => ({
  id,
  name: `${id}.png`,
  type: "image/png",
  size: 1,
  uploadStatus: "processing",
})

describe("BlockSliceAction file attachments", () => {
  it("finds an attachment block by the attachment id", () => {
    const store = createStore<BlockSlice>()(createBlockSlice())
    const { blockActions } = store.getState()

    blockActions.addFileAttachment(createAttachment("file-1"))
    blockActions.addFileAttachment(createAttachment("file-2"))

    blockActions.updateFileAttachmentStatus("file-1", "error", "upload failed")
    blockActions.removeFileAttachment("file-2")

    expect(store.getState().blocks).toEqual([
      {
        id: "file-1",
        type: "fileAttachment",
        attachment: {
          ...createAttachment("file-1"),
          uploadStatus: "error",
          errorMessage: "upload failed",
        },
      },
    ])
  })
})
