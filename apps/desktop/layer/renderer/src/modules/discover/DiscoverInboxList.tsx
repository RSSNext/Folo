import { Button } from "@follow/components/ui/button/index.js"
import { repository } from "@pkg"
import { useTranslation } from "react-i18next"

import { useModalStack } from "~/components/ui/modal/stacked/hooks"

import { InboxTable } from "./Inbox"
import { InboxForm } from "./InboxForm"

export function DiscoverInboxList() {
  const { t } = useTranslation()

  const { present } = useModalStack()

  return (
    <div className="mx-auto w-full max-w-[540px] rounded-lg border bg-material-ultra-thin p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
        <span>{t("discover.inbox.description")}</span>
        <a
          href={`${repository.url}/wiki/Inbox#webhooks`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-auto items-center gap-1 rounded-full border border-accent px-2 py-px text-sm text-accent"
        >
          <i className="i-mgc-book-6-cute-re" />
          <span>{t("discover.inbox.webhooks_docs")}</span>
        </a>
      </div>
      <InboxTable />
      <div className="center mt-4 flex">
        {/* New Inbox */}
        <Button
          textClassName="flex items-center gap-2"
          onClick={() =>
            present({
              title: t("sidebar.feed_actions.new_inbox"),
              content: () => <InboxForm asWidget />,
            })
          }
        >
          <i className="i-mgc-add-cute-re" />
          {t("discover.inbox_create")}
        </Button>
      </div>
    </div>
  )
}
