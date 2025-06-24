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

import { InboxActions, InboxEmail, InboxSecret } from "./InboxTable.shared"

export const InboxTable = () => {
  const { t } = useTranslation()
  const inboxes = useInboxList()
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
