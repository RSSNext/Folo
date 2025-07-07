import { env } from "@follow/shared/env.desktop"

import { CopyButton } from "~/components/ui/button/CopyButton"

export const InboxEmail = ({ id }: { id: string }) => {
  return (
    <div className="group relative flex w-fit items-center gap-2">
      <span className="shrink-0">
        {id}
        {env.VITE_INBOXES_EMAIL}
      </span>
      <CopyButton
        value={`${id}${env.VITE_INBOXES_EMAIL}`}
        className="p-1 lg:absolute lg:-right-6 lg:opacity-0 lg:group-hover:opacity-100 [&_i]:size-3"
      />
    </div>
  )
}
