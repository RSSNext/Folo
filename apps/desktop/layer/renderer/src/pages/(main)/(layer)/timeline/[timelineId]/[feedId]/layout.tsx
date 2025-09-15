import { withFeature } from "~/lib/features"
import { AIEnhancedTimelineLayout } from "~/modules/app-layout/ai-enhanced-timeline"
import { TimelineEntryTwoColumnLayout } from "~/modules/app-layout/TimelineEntryTwoColumnLayout"

export const Component = withFeature("ai")(AIEnhancedTimelineLayout, TimelineEntryTwoColumnLayout)
