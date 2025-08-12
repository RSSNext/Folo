import { Tabs, TabsContent, TabsList, TabsTrigger } from "@follow/components/ui/tabs/index.jsx"
import { FeedViewType } from "@follow/constants"

import { DayOf } from "./constants"
import { DailyReportModalContent, DailyReportTitle } from "./daily"
import { useParseDailyDate } from "./useParseDailyDate"

const tabs = [DayOf.Today, DayOf.Yesterday]

export const FeedDailyModalContent = () => {
  const today = useParseDailyDate(DayOf.Today)
  const yesterday = useParseDailyDate(DayOf.Yesterday)

  return (
    <Tabs defaultValue={DayOf.Today as any} className="flex h-full flex-col">
      <TabsList className="w-full">
        {tabs.map((tab: any) => (
          <TabsTrigger key={tab} value={tab}>
            <DailyReportTitle
              containerClassName="pb-0"
              {...(tab === DayOf.Today ? today : yesterday)}
            />
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="-mx-2 flex grow flex-col items-center overflow-auto lg:mx-0">
        {tabs.map((tab: any) => (
          <TabsContent
            key={tab}
            value={tab}
            className="flex grow flex-col data-[state=inactive]:hidden"
          >
            <DailyReportModalContent
              view={FeedViewType.SocialMedia}
              {...(tab === DayOf.Today ? today : yesterday)}
            />
          </TabsContent>
        ))}
      </div>
    </Tabs>
  )
}
