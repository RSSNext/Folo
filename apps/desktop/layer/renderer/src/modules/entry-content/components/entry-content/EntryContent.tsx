import { withAppErrorBoundary } from "~/components/common/withAppErrorBoundary"
import { ErrorComponentType } from "~/components/errors/enum"
import { withFeature } from "~/lib/features"

import { EntryContent as EntryContentAI } from "./EntryContent.ai"
import { EntryContent as EntryContentLegacy } from "./EntryContent.legacy"

export const EntryContent = withAppErrorBoundary(
  withFeature("ai")(EntryContentAI, EntryContentLegacy),
  {
    errorType: ErrorComponentType.EntryNotFound,
  },
)
