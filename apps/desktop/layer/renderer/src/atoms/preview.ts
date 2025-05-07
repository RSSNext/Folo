import { atom } from "jotai"

import { createAtomHooks } from "~/lib/jotai"

export const [, , , , previewBackPath, setPreviewBackPath] = createAtomHooks(atom<string>())
