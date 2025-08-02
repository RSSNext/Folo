import { withSuspense } from "@follow/utils"

import { withFeature } from "~/lib/features"

import { EntryContent as EntryContentAI } from "./EntryContent.ai"
import { EntryContent as EntryContentLegacy } from "./EntryContent.legacy"

export const EntryContent = withSuspense(withFeature("ai")(EntryContentAI, EntryContentLegacy))
