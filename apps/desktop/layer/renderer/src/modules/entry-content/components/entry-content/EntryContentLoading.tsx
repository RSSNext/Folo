import { Avatar, AvatarImage } from "@follow/components/ui/avatar/index.jsx"
import { LoadingCircle, LoadingWithIcon } from "@follow/components/ui/loading/index.jsx"
import { getUrlIcon } from "@follow/utils/utils"

export const EntryContentLoading = (props: { icon?: string | null }) => {
  if (!props.icon) {
    return <LoadingWithIcon size="large" icon={<i className="i-mgc-docment-cute-re" />} />
  }
  return (
    <div className="center mb-14 flex flex-col gap-4">
      <Avatar className="animate-pulse rounded-sm">
        <AvatarImage src={getUrlIcon(props.icon).src} />
      </Avatar>
      <LoadingCircle size="medium" />
    </div>
  )
}
