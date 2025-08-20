import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"
import { useTranslation } from "react-i18next"

import { useAuthQuery } from "~/hooks/common"
import { Queries } from "~/queries"

import type { RouteParams } from "./DiscoverFeedForm"
import { DiscoverFeedForm } from "./DiscoverFeedForm"

const getTransformRouteParams = (t: any): RouteParams => ({
  title: {
    description: t("discover.transform.title_desc"),
    default: t("discover.transform.title_default"),
  },
  item: {
    description: t("discover.transform.item_desc"),
    default: t("discover.transform.item_default"),
  },
  itemTitle: {
    description: t("discover.transform.item_title_desc"),
    default: t("discover.transform.item_title_default"),
  },
  itemTitleAttr: {
    description: t("discover.transform.item_title_attr_desc"),
    default: t("discover.transform.item_title_attr_default"),
  },
  itemLink: {
    description: t("discover.transform.item_link_desc"),
    default: t("discover.transform.item_link_default"),
  },
  itemLinkAttr: {
    description: t("discover.transform.item_link_attr_desc"),
    default: t("discover.transform.item_link_attr_default"),
  },
  itemDesc: {
    description: t("discover.transform.item_desc_desc"),
    default: t("discover.transform.item_desc_default"),
  },
  itemDescAttr: {
    description: t("discover.transform.item_desc_attr_desc"),
    default: t("discover.transform.item_desc_attr_default"),
  },
  itemPubDate: {
    description: t("discover.transform.item_pubdate_desc"),
    default: t("discover.transform.item_pubdate_default"),
  },
  itemPubDateAttr: {
    description: t("discover.transform.item_pubdate_attr_desc"),
    default: t("discover.transform.item_pubdate_attr_default"),
  },
  itemContent: {
    description: t("discover.transform.item_content_desc"),
  },
  encoding: {
    description: t("discover.transform.encoding_desc"),
    default: t("discover.transform.encoding_default"),
  },
})

export function DiscoverTransform() {
  const { t } = useTranslation()
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
            routeParams={getTransformRouteParams(t)}
            noDescription
            viewportClassName="pt-0 max-h-none"
          />
        </div>
      )}
    </>
  )
}
