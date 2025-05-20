import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"

import { useAuthQuery } from "~/hooks/common"
import { Queries } from "~/queries"

import type { RouteParams } from "./DiscoverFeedForm"
import { DiscoverFeedForm } from "./DiscoverFeedForm"

const transformRouteParams: RouteParams = {
  title: { description: "The title of the RSS", default: "Extract from <title>" },
  item: { description: "The HTML elements as item using CSS selector", default: "html" },
  itemTitle: {
    description: "The HTML elements as title in item using CSS selector",
    default: "item element",
  },
  itemTitleAttr: {
    description: "The attributes of title element as title",
    default: "Element text",
  },
  itemLink: {
    description: "The HTML elements as link in item using CSS selector",
    default: "item element",
  },
  itemLinkAttr: { description: "The attributes of link element as link", default: "href" },
  itemDesc: {
    description: "The HTML elements as description in item using CSS selector",
    default: "item element",
  },
  itemDescAttr: {
    description: "The attributes of description element as description",
    default: "Element html",
  },
  itemPubDate: {
    description: "The HTML elements as pubDate in item using CSS selector",
    default: "item element",
  },
  itemPubDateAttr: {
    description: "The attributes of pubDate element as pubDate",
    default: "Element html",
  },
  itemContent: {
    description:
      "The HTML elements as description in item using CSS selector ( in itemLink page for full content )",
  },
  encoding: { description: "The encoding of the HTML content", default: "utf-8" },
}

export function DiscoverTransform() {
  const { data, isLoading } = useAuthQuery(
    Queries.discover.rsshubNamespace({
      namespace: "rsshub",
    }),
    {
      meta: {
        persist: true,
      },
    },
  )

  if (isLoading) {
    return (
      <div className="center mt-12 flex w-full flex-col gap-8">
        <LoadingCircle size="large" />
      </div>
    )
  }

  return (
    <>
      {data?.rsshub!.routes && (
        <div className="bg-material-ultra-thin w-full max-w-screen-sm rounded-lg border p-5 shadow-sm">
          <DiscoverFeedForm
            routePrefix="rsshub"
            route={data?.rsshub.routes["/transform/html/:url/:routeParams"]!}
            routeParams={transformRouteParams}
            noDescription
            viewportClassName="pt-0 max-h-none"
          />
        </div>
      )}
    </>
  )
}
