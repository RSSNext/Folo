import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { FollowFeed, FollowUrl } from "@/src/modules/feed/FollowFeed"
import { parseLinkView } from "@/src/modules/feed/link-view"
import { FollowList } from "@/src/modules/list/FollowList"

export const FollowScreen: NavigationControllerView<{
  id?: string
  type: "feed" | "list" | "url"
  url?: string
  /** The view a link asks for. A list's view is the list's own. */
  view?: string
}> = ({ id, type, url, view }) => {
  const defaultView = parseLinkView(view)
  // Keyed, so a form that another link replaces starts over rather than keeping what was typed
  switch (type) {
    case "feed": {
      return <FollowFeed key={id} id={id as string} defaultView={defaultView} />
    }
    case "list": {
      return <FollowList key={id} id={id as string} />
    }
    case "url": {
      return <FollowUrl key={url} url={url as string} defaultView={defaultView} />
    }
    default: {
      return <FollowFeed key={id} id={id as string} defaultView={defaultView} />
    }
  }
}
