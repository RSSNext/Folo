import { Divider } from "@follow/components/ui/divider/Divider.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@follow/components/ui/tabs/index.jsx"
import { UserRole } from "@follow/constants"
import { cn } from "@follow/utils/utils"
import { createElement } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router"

import { useUserRole } from "~/atoms/user"
import { AppErrorBoundary } from "~/components/common/AppErrorBoundary"
import { ErrorComponentType } from "~/components/errors/enum"
import { useActivationModal } from "~/modules/activation"
import { useSubViewTitle } from "~/modules/app-layout/subview/hooks"
import { DiscoverForm } from "~/modules/discover/form"
import { DiscoverImport } from "~/modules/discover/import"
import { DiscoverInboxList } from "~/modules/discover/inbox-list-form"
import { Recommendations } from "~/modules/discover/recommendations"
import { DiscoverTransform } from "~/modules/discover/transform-form"
import { DiscoverUser } from "~/modules/discover/user-form"
import { Trending } from "~/modules/trending"

const tabs: {
  name: I18nKeys
  value: string
  disableForTrial?: boolean
}[] = [
  {
    name: "words.search",
    value: "search",
  },
  {
    name: "words.rss",
    value: "rss",
  },
  {
    name: "words.rsshub",
    value: "rsshub",
  },
  {
    name: "words.inbox",
    value: "inbox",
    disableForTrial: true,
  },
  {
    name: "words.user",
    value: "user",
  },
  {
    name: "words.transform",
    value: "transform",
  },
  {
    name: "words.import",
    value: "import",
  },
]

export function Component() {
  const [search, setSearch] = useSearchParams()
  const { t } = useTranslation()
  useSubViewTitle("words.discover")

  const presentActivationModal = useActivationModal()
  const role = useUserRole()

  const currentTabs = tabs.map((tab) => {
    const disabled = tab.disableForTrial && role === UserRole.Trial
    return {
      ...tab,
      disabled,
    }
  })

  return (
    <div className="relative flex w-full flex-col items-center gap-8 px-4 pb-8 lg:pb-4">
      <div className="pt-12 text-2xl font-bold">{t("words.discover")}</div>
      <Tabs
        value={search.get("type") || "search"}
        onValueChange={(val) => {
          setSearch(
            (search) => {
              search.set("type", val)
              return new URLSearchParams(search)
            },
            { replace: true },
          )
        }}
        className="w-full"
      >
        <ScrollArea.ScrollArea flex orientation="horizontal" rootClassName="w-full">
          <TabsList className="relative flex w-full">
            {currentTabs.map((tab) => (
              <TabsTrigger
                key={tab.name}
                value={tab.value}
                className={cn(tab.disabled && "cursor-not-allowed opacity-50")}
                onClick={() => {
                  if (tab.disabled) {
                    presentActivationModal()
                  }
                }}
              >
                {t(tab.name)}
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea.ScrollArea>
        {currentTabs.map((tab) => (
          <TabsContent key={tab.name} value={tab.value} className="mt-8">
            <div className={tab.value === "inbox" ? "" : "center flex flex-col"}>
              {createElement(TabComponent[tab.value]! || TabComponent.default, {
                type: tab.value,
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      <Divider className="w-full max-w-[800px]" />
      <Trending center />
      <Divider className="w-full max-w-[800px]" />
      <AppErrorBoundary errorType={ErrorComponentType.RSSHubDiscoverError}>
        <Recommendations />
      </AppErrorBoundary>
    </div>
  )
}

const TabComponent: Record<string, React.FC<{ type?: string; isInit?: boolean }>> = {
  import: DiscoverImport,
  inbox: DiscoverInboxList,
  user: DiscoverUser,
  default: DiscoverForm,
  transform: DiscoverTransform,
}
