import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { FollowFeed, FollowUrl } from "@/src/modules/feed/FollowFeed"
import { FollowList } from "@/src/modules/list/FollowList"

export const FollowScreen: NavigationControllerView<{
  id?: string
  type: "feed" | "list" | "url"
  url?: string
}> = ({ id, type, url }) => {
  switch (type) {
    case "feed": {
      return <FollowFeed id={id as string} />
    }
    case "list": {
      return <FollowList id={id as string} />
    }
    case "url": {
      return <FollowUrl url={url as string} />
    }
    default: {
      return <FollowFeed id={id as string} />
    }
  }
}
