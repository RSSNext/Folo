import { followClient } from "~/lib/api-client"
import { defineQuery } from "~/lib/defineQuery"

export const discover = {
  rsshubCategory: ({
    category,
    categories,
    lang,
  }: {
    category?: string
    categories?: string
    lang?: string
  }) =>
    defineQuery(
      ["discover", "rsshub", "category", category, categories, lang],
      async () => {
        const res = await followClient.api.discover.rsshub({
          category,
          categories,
          ...(lang !== "all" && { lang }),
        })
        return res.data
      },
      {
        rootKey: ["discover", "rsshub", "category"],
      },
    ),
  rsshubNamespace: ({ namespace }: { namespace: string }) =>
    defineQuery(["discover", "rsshub", "namespace", namespace], async () => {
      const res = await followClient.api.discover.rsshub({
        namespace,
      })
      return res.data
    }),
  rsshubRoute: ({ route }: { route: string }) =>
    defineQuery(["discover", "rsshub", "route", route], async () => {
      const res = await followClient.api.discover.rsshubRoute({
        route,
      })
      return res.data
    }),
  rsshubAnalytics: ({ lang }: { lang?: string }) =>
    defineQuery(["discover", "rsshub", "analytics", lang], async () => {
      const res = await followClient.api.discover.rsshubAnalytics({
        ...(lang !== "all" && { lang }),
      })
      return res.data
    }),
}
