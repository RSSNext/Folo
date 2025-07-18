import { Divider } from "@follow/components/ui/divider/Divider.js"
import { useScrollElementUpdate } from "@follow/components/ui/scroll-area/hooks.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@follow/components/ui/tabs/index.jsx"
import { UserRole } from "@follow/constants"
import { useUserRole } from "@follow/store/user/hooks"
import { cn } from "@follow/utils/utils"
import { createElement } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router"

import { AppErrorBoundary } from "~/components/common/AppErrorBoundary"
import { ErrorComponentType } from "~/components/errors/enum"
import { useActivationModal } from "~/modules/activation"
import { useSubViewTitle } from "~/modules/app-layout/subview/hooks"
import { DiscoverForm } from "~/modules/discover/DiscoverForm"
import { DiscoverImport } from "~/modules/discover/DiscoverImport"
import { DiscoverInboxList } from "~/modules/discover/DiscoverInboxList"
import { DiscoverTransform } from "~/modules/discover/DiscoverTransform"
import { DiscoverUser } from "~/modules/discover/DiscoverUser"
import { Recommendations } from "~/modules/discover/recommendations"
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
  const { onUpdateMaxScroll } = useScrollElementUpdate()

  const currentTabs = tabs.map((tab) => {
    const disabled = tab.disableForTrial && (role === UserRole.Free || role === UserRole.Trial)
    return {
      ...tab,
      disabled,
    }
  })

  return (
    <div className="flex size-full flex-col px-6 py-8">
      {/* Simple Header */}
      <div className="mx-auto mb-8 max-w-6xl text-center">
        <h1 className="text-text mb-4 text-3xl font-bold">{t("words.discover")}</h1>
      </div>

      <div className="mx-auto w-full max-w-6xl">
        <Tabs
          value={search.get("type") || "search"}
          onValueChange={(val) => {
            setSearch(
              (search) => {
                search.set("type", val)
                search.delete("keyword")
                return new URLSearchParams(search)
              },
              { replace: true },
            )
          }}
          className="w-full"
        >
          {/* Tab Navigation */}
          <div className="mb-8">
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
                      } else {
                        onUpdateMaxScroll?.()
                      }
                    }}
                  >
                    {t(tab.name)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea.ScrollArea>
          </div>

          {/* Tab Content */}
          <div className="space-y-8">
            {currentTabs.map((tab) => (
              <TabsContent key={tab.name} value={tab.value} className="mt-0">
                <div className={tab.value === "inbox" ? "" : "flex flex-col items-center"}>
                  {createElement(TabComponent[tab.value]! || TabComponent.default, {
                    type: tab.value,
                  })}
                </div>
              </TabsContent>
            ))}
          </div>
        </Tabs>

        {/* Additional Content Sections */}
        <div className="mt-12 space-y-8">
          <Divider />

          <div>
            <h2 className="text-text mb-6 text-center text-xl font-semibold">Trending</h2>
            <Trending center />
          </div>

          <Divider />

          <div>
            <h2 className="text-text mb-6 text-center text-xl font-semibold">Recommendations</h2>
            <AppErrorBoundary errorType={ErrorComponentType.RSSHubDiscoverError}>
              <Recommendations />
            </AppErrorBoundary>
          </div>
        </div>
      </div>
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
