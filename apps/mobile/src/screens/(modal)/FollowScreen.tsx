import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { FollowFeed, FollowUrl } from "@/src/modules/feed/FollowFeed"
import { FollowList } from "@/src/modules/list/FollowList"

export const FollowScreen: NavigationControllerView<{
  id?: string
  type: "feed" | "list" | "url"
  url?: string
}> = ({ id, type, url }) => {
  // Keyed, so a form that another link replaces starts over rather than keeping what was typed
  switch (type) {
    case "feed": {
      return <FollowFeed key={id} id={id as string} />
    }
    case "list": {
      return <FollowList key={id} id={id as string} />
    }
    case "url": {
      return <FollowUrl key={url} url={url as string} />
    }
    default: {
      return <FollowFeed key={id} id={id as string} />
    }
  }
}
