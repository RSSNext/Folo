import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@follow/components/ui/table/index.jsx"
import { useInboxById, useInboxList } from "@follow/store/inbox/hooks"
import { memo } from "react"
import { useTranslation } from "react-i18next"

import { InboxActions } from "./InboxActions"
import { InboxEmail } from "./InboxEmail"
import { InboxSecret } from "./InboxSecret"

export const InboxTable = () => {
  const { t } = useTranslation()
  const inboxes = useInboxList()
  if (inboxes.length === 0)
    return (
      <div className="center mb-4 flex flex-col gap-2 text-sm text-text-secondary">
        <i className="i-mingcute-empty-box-line text-3xl" />
        <span className="center max-w-sm text-balance text-center text-sm text-text-secondary">
          {t("discover.inbox.no_inbox")}
        </span>
      </div>
    )
  return (
    <Table containerClassName="overflow-auto mb-8">
      <TableHeader>
        <TableRow>
          <TableHead className="pl-0 pr-6">{t("discover.inbox.handle")}</TableHead>
          <TableHead className="pl-0 pr-6">{t("discover.inbox.email")}</TableHead>
          <TableHead className="pl-0 pr-6">{t("discover.inbox.title")}</TableHead>
          <TableHead className="pl-0 pr-6">{t("discover.inbox.secret")}</TableHead>
          <TableHead className="center px-0">{t("discover.inbox.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {inboxes?.map((inbox) => (
          <Row id={inbox.id} key={inbox.id} />
        ))}
      </TableBody>
    </Table>
  )
}

const Row = memo(({ id }: { id: string }) => {
  const inbox = useInboxById(id)
  if (!inbox) return null
  return (
    <TableRow key={inbox.id}>
      <TableCell size="sm">{inbox.id}</TableCell>
      <TableCell size="sm">
        <InboxEmail id={inbox.id} />
      </TableCell>
      <TableCell size="sm">{inbox.title}</TableCell>
      <TableCell size="sm">
        <InboxSecret secret={inbox.secret} />
      </TableCell>
      <TableCell size="sm" className="center">
        <InboxActions id={inbox.id} />
      </TableCell>
    </TableRow>
  )
})
