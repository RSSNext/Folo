import { withFeature } from "~/lib/features"
import { CenterColumnLayout } from "~/modules/app-layout/timeline-column/index"
import { AIEntryLayout } from "~/modules/entry-column/AIEntryLayout"

export const Component = withFeature("ai")(AIEntryLayout, CenterColumnLayout)
