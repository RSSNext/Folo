import { CopyButton } from "~/components/ui/button/CopyButton"

export const InboxSecret = ({ secret }: { secret: string }) => {
  return (
    <div className="group relative flex w-fit items-center gap-2 font-mono">
      <span className="shrink-0">****</span>
      <CopyButton
        value={secret}
        className="p-1 lg:absolute lg:-right-6 lg:opacity-0 lg:group-hover:opacity-100 [&_i]:size-3"
      />
    </div>
  )
}
