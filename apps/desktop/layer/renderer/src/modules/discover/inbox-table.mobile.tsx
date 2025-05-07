import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"
import { memo } from "react"

import { useInboxList } from "~/queries/inboxes"
import { useInboxById } from "~/store/inbox"

import { InboxActions, InboxEmail, InboxSecret } from "./inbox-table.shared"

export const InboxTable = () => {
  const inboxes = useInboxList()
  return inboxes.isLoading ? (
    <div className="center w-full">
      <LoadingCircle size="large" />
    </div>
  ) : (
    <ul className="mt-4 flex flex-col gap-2">
      {inboxes.data?.map((inbox) => <Row id={inbox.id} key={inbox.id} />)}
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
