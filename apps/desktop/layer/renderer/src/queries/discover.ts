import { apiClient } from "~/lib/api-fetch"
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
    defineQuery(["discover", "rsshub", "category", category, categories, lang], async () => {
      const res = await apiClient.discover.rsshub.$get({
        query: {
          category,
          categories,
          ...(lang !== "all" && { lang }),
        },
      })
      return res.data
    }),
  rsshubNamespace: ({ namespace }: { namespace: string }) =>
    defineQuery(["discover", "rsshub", "namespace", namespace], async () => {
      const res = await apiClient.discover.rsshub.$get({
        query: {
          namespace,
        },
      })
      return res.data
    }),
  rsshubRoute: ({ route }: { route: string }) =>
    defineQuery(["discover", "rsshub", "route", route], async () => {
      const res = await apiClient.discover.rsshub.route.$get({
        query: {
          route,
        },
      })
      return res.data
    }),
}
