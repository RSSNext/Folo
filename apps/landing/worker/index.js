import handler from 'vinext/server/app-router-entry'
import { handleImageOptimization } from 'vinext/server/image-optimization'

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === '/_vinext/image') {
      return handleImageOptimization(request, {
        fetchAsset: (path) =>
          env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body)
            .transform(width > 0 ? { width } : {})
            .output({ format, quality })
          return result.response()
        },
      })
    }

    return handler.fetch(request)
  },
}
