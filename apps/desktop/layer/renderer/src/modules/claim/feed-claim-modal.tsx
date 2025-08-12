import { AutoResizeHeight } from "@follow/components/ui/auto-resize-height/index.jsx"
import { Button } from "@follow/components/ui/button/index.js"
import { Card, CardHeader } from "@follow/components/ui/card/index.jsx"
import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@follow/components/ui/tabs/index.jsx"
import { useFeedById } from "@follow/store/feed/hooks"
import type { FC } from "react"
import { useEffect } from "react"
import { Trans, useTranslation } from "react-i18next"

import { CopyButton } from "~/components/ui/button/CopyButton"
import { ShikiHighLighter } from "~/components/ui/code-highlighter"
import { useShikiDefaultTheme } from "~/components/ui/code-highlighter/shiki/hooks"
import { useCurrentModal } from "~/components/ui/modal/stacked/hooks"
import { useAuthQuery } from "~/hooks/common"
import { FollowSummary } from "~/modules/feed/feed-summary"
import { feed as feedQuery, useClaimFeedMutation } from "~/queries/feed"

export const FeedClaimModalContent: FC<{
  feedId: string
}> = ({ feedId }) => {
  const { t } = useTranslation()
  const feed = useFeedById(feedId)
  const {
    data: claimMessage,
    isLoading,
    error,
  } = useAuthQuery(feedQuery.claimMessage({ feedId }), {
    enabled: !!feed,
  })
  const { setClickOutSideToDismiss } = useCurrentModal()

  const { mutateAsync: claim, isPending, isSuccess } = useClaimFeedMutation(feedId)

  useEffect(() => {
    setClickOutSideToDismiss(!isPending)
  }, [isPending, setClickOutSideToDismiss])

  const shikiTheme = useShikiDefaultTheme()

  if (!feed) return null

  if (isLoading) {
    return (
      <div className="center h-32 lg:w-[650px]">
        <LoadingCircle size="large" />
      </div>
    )
  }

  if (error) {
    return <div>{t("feed_claim_modal.failed_to_load")}</div>
  }

  return (
    <div className="mx-auto w-full max-w-[650px]">
      <Card className="mb-2">
        <CardHeader>
          <FollowSummary feed={feed} />
        </CardHeader>
      </Card>
      <p>{t("feed_claim_modal.verify_ownership")}</p>
      <p>{t("feed_claim_modal.choose_verification_method")}</p>
      <Tabs defaultValue="content" className="mt-4">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="content">{t("feed_claim_modal.tab_content")}</TabsTrigger>
          <TabsTrigger value="description">{t("feed_claim_modal.tab_description")}</TabsTrigger>
          <TabsTrigger value="rss">{t("feed_claim_modal.tab_rss")}</TabsTrigger>
        </TabsList>
        <AutoResizeHeight duration={0.1} className="px-2">
          <TabsContent className="mt-0 pt-3" value="content">
            <p>{t("feed_claim_modal.content_instructions")}</p>
            {feed.url.startsWith("rsshub://") && (
              <p className="mt-2 text-sm leading-tight text-orange-800 dark:text-orange-500/70">
                {t("feed_claim_modal.rsshub_notice")}
              </p>
            )}
            <BaseCodeBlock>{claimMessage?.data.content || ""}</BaseCodeBlock>
          </TabsContent>
          <TabsContent className="mt-0 pt-3" value="description">
            <p className="mb-2 leading-none">{t("feed_claim_modal.description_current")}</p>
            <p className="my-2 text-xs text-zinc-500">{feed.description}</p>
            <Trans
              i18nKey="feed_claim_modal.description_instructions"
              components={{ code: <code className="text-sm">{"<description />"}</code> }}
            />
            {feed.url.startsWith("rsshub://") && (
              <p className="mt-1 leading-tight text-orange-800">
                {t("feed_claim_modal.rsshub_notice")}
              </p>
            )}
            <BaseCodeBlock>{claimMessage?.data.description || ""}</BaseCodeBlock>
          </TabsContent>
          <TabsContent className="mt-0 pt-3" value="rss">
            <div className="space-y-3">
              <p>{t("feed_claim_modal.rss_instructions")}</p>
              <p>{t("feed_claim_modal.rss_format_choice")}</p>
              <p>
                <b>{t("feed_claim_modal.rss_xml_format")}</b>
              </p>
              <ShikiHighLighter
                transparent
                theme={shikiTheme}
                className="border-border group relative mt-3 cursor-auto select-text whitespace-pre break-words rounded-lg border bg-zinc-100 text-sm dark:bg-neutral-800 [&_pre]:whitespace-pre [&_pre]:break-words [&_pre]:!p-0"
                code={claimMessage?.data.xml || ""}
                language="xml"
              />
              <p>
                <b>{t("feed_claim_modal.rss_json_format")}</b>
              </p>
              <ShikiHighLighter
                transparent
                theme={shikiTheme}
                className="border-border group relative mt-3 cursor-auto select-text whitespace-pre break-words rounded-lg border bg-zinc-100 text-sm dark:bg-neutral-800 [&_pre]:whitespace-pre [&_pre]:break-words [&_pre]:!p-0"
                code={JSON.stringify(JSON.parse(claimMessage?.data.json || "{}"), null, 2)}
                language="json"
              />
            </div>
          </TabsContent>
        </AutoResizeHeight>
      </Tabs>

      <div className="mt-4 flex justify-end">
        <Button
          disabled={isSuccess}
          isLoading={isPending}
          onClick={() => claim()}
          variant={isSuccess ? "outline" : "primary"}
        >
          {isSuccess && <i className="i-mgc-check-circle-filled mr-2 bg-green-500" />}
          <span>{t("feed_claim_modal.claim_button")}</span>
        </Button>
      </div>
    </div>
  )
}

const BaseCodeBlock: FC<{
  children: string
}> = ({ children }) => (
  <pre className="border-border group relative mt-3 cursor-auto select-text whitespace-pre-line break-words rounded-lg border bg-zinc-100 p-2 text-sm dark:bg-neutral-800">
    <code>{children}</code>
    <CopyButton
      value={children}
      className="absolute bottom-2 right-2 z-[3] opacity-0 group-hover:opacity-100"
    />
  </pre>
)
