import type { Document } from "linkedom"
import xss from "xss"

export function buildSeoMetaTags(
  document: Document,
  configs: {
    openGraph: {
      title: string
      description?: string
      image?: string | null
    }
  },
) {
  const openGraph = {
    title: xss(configs.openGraph.title),
    description: xss(configs.openGraph.description ?? ""),
    image: xss(configs.openGraph.image ?? ""),
  }

  const createMeta = (property: string, content: string) => {
    const $meta = document.createElement("meta")
    $meta.setAttribute("property", property)
    $meta.setAttribute("content", content)
    return $meta
  }

  return [
    createMeta("og:title", openGraph.title),
    createMeta("og:description", openGraph.description),
    createMeta("og:image", openGraph.image),
    createMeta("twitter:card", "summary_large_image"),
    createMeta("twitter:title", openGraph.title),
    createMeta("twitter:description", openGraph.description),
    createMeta("twitter:image", openGraph.image),
  ]
}
