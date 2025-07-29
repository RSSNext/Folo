import { withFeature } from "~/lib/features"
import { CenterColumnLayout } from "~/modules/app-layout/timeline-column/index"
import { EntryColumnLayout } from "~/modules/entry-column/EntryColumnLayout"

export const Component = withFeature("ai")(EntryColumnLayout, CenterColumnLayout)
