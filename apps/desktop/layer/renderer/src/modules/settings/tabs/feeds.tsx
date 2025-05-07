import { Divider } from "@follow/components/ui/divider/index.js"
import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@follow/components/ui/table/index.jsx"
import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/index.js"
import { useTranslation } from "react-i18next"

import { useAuthQuery } from "~/hooks/common"
import { UrlBuilder } from "~/lib/url-builder"
import { FeedIcon } from "~/modules/feed/feed-icon"
import { Balance } from "~/modules/wallet/balance"
import { Queries } from "~/queries"

export const SettingFeeds = () => {
  const { t } = useTranslation("settings")
  const claimedList = useAuthQuery(Queries.feed.claimedList())

  return (
    <section className="mt-4">
      <div className="mb-4 space-y-2 text-sm">
        <p>{t("feeds.claimTips")}</p>
      </div>
      <Divider className="mb-6 mt-8" />
      <div className="flex flex-1 flex-col">
        <ScrollArea.ScrollArea viewportClassName="max-h-[380px]">
          {claimedList.data?.length ? (
            <Table className="mt-4">
              <TableHeader className="border-b">
                <TableRow className="[&_*]:!font-semibold">
                  <TableHead className="w-16 text-center" size="sm">
                    {t("feeds.tableHeaders.name")}
                  </TableHead>
                  <TableHead className="text-center" size="sm">
                    {t("feeds.tableHeaders.subscriptionCount")}
                  </TableHead>
                  <TableHead className="text-center" size="sm">
                    {t("feeds.tableHeaders.tipAmount")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="border-t-[12px] border-transparent">
                {claimedList.data?.map((row) => (
                  <TableRow key={row.feed.id} className="h-8">
                    <TableCell size="sm" width={200}>
                      <a
                        target="_blank"
                        href={UrlBuilder.shareFeed(row.feed.id)}
                        className="flex items-center"
                      >
                        <FeedIcon fallback feed={row.feed} size={16} />
                        <EllipsisHorizontalTextWithTooltip className="inline-block max-w-[200px] truncate">
                          {row.feed.title}
                        </EllipsisHorizontalTextWithTooltip>
                      </a>
                    </TableCell>
                    <TableCell align="center" className="tabular-nums" size="sm">
                      {row.subscriptionCount}
                    </TableCell>
                    <TableCell align="center" size="sm">
                      <Balance>{BigInt(row.tipAmount || 0n)}</Balance>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : claimedList.isLoading ? (
            <LoadingCircle size="large" className="center absolute inset-0" />
          ) : (
            <div className="mt-36 w-full text-center text-sm text-zinc-400">
              <p>{t("feeds.noFeeds")}</p>
            </div>
          )}
        </ScrollArea.ScrollArea>
      </div>
    </section>
  )
}
