import { useInboxById, useInboxList } from "@follow/store/inbox/hooks"
import { memo } from "react"

import { InboxActions, InboxEmail, InboxSecret } from "./InboxTable.shared"

export const InboxTable = () => {
  const inboxes = useInboxList()
  return (
    <ul className="mt-4 flex flex-col gap-2">
      {inboxes.map((inbox) => (
        <Row id={inbox.id} key={inbox.id} />
      ))}
    </ul>
  )
}

const Row = memo(({ id }: { id: string }) => {
  const inbox = useInboxById(id)
  if (!inbox) return null

  return (
    <li className="flex flex-col gap-3 rounded border p-3">
      {!!inbox.title && <p className="text-sm font-semibold opacity-70">{inbox.title}</p>}
      <div className="flex gap-2">
        <InboxEmail id={inbox.id} />
        <InboxSecret secret={inbox.secret} />
      </div>
      <div className="flex justify-end">
        <InboxActions id={inbox.id} />
      </div>
    </li>
  )
})
