import "./global"

// Global route dependencies
import { env } from "@follow/shared/env.ssr"
import { Hono } from "hono"
import { minify } from "html-minifier-terser"
import { parseHTML } from "linkedom"
import { FetchError } from "ofetch"
import xss from "xss"

// @ts-expect-error - WASM import handled by Wrangler
import resvgWasm from "./resvg.wasm"
// OG image rendering
import { createFollowClient } from "./src/lib/api-client"
import { NotFoundError } from "./src/lib/not-found"
import { setFontsBucket } from "./src/lib/og/fonts.worker"
import { setWasmModule } from "./src/lib/og/resvg-wasm-shim"
import { buildSeoMetaTags } from "./src/lib/seo"
import {
  createRequestProxy,
  requestContext,
  runWithRequestContext,
} from "./src/lib/worker-request-context"
import { injectMetaHandler, MetaError } from "./src/meta-handler"
import { renderFeedOG } from "./src/router/og/feed"
import { renderListOG } from "./src/router/og/list"
import { renderUserOG } from "./src/router/og/user"

Object.assign(globalThis, {
  __DEV__: false,
})

// Initialize WASM module
setWasmModule(resvgWasm)

interface Env {
  FONTS_BUCKET: R2Bucket
  ASSETS: Fetcher
  VITE_API_URL: string
  VITE_WEB_URL: string
  VITE_EXTERNAL_DEV_API_URL: string
  VITE_EXTERNAL_PROD_API_URL: string
  VITE_WEB_DEV_URL: string
  VITE_SENTRY_DSN: string
}

const app = new Hono<{ Bindings: Env }>()

let envInitialized = false

// Redirects (migrated from vercel.json)
app.get("/feed/:id", (c) => {
  return c.redirect(`/share/feeds/${c.req.param("id")}`, 301)
})
app.get("/list/:id", (c) => {
  return c.redirect(`/share/lists/${c.req.param("id")}`, 301)
})
app.get("/profile/:path{.*}", (c) => {
  return c.redirect(`/share/users/${c.req.param("path")}`, 301)
})

// Middleware: set up env vars and request context
app.use("*", async (c, next) => {
  if (!envInitialized) {
    const bindings = c.env
    for (const [key, value] of Object.entries(bindings)) {
      if (typeof value === "string") {
        process.env[key] = value
      }
    }
    if (bindings.FONTS_BUCKET) {
      setFontsBucket(bindings.FONTS_BUCKET)
    }
    envInitialized = true
  }

  return runWithRequestContext(async () => {
    // Determine upstream env from host
    const host = c.req.header("host") || ""
    const forwardedHost = c.req.header("x-forwarded-host")
    const finalHost = forwardedHost || host
    const upstreamEnv =
      finalHost === "dev.folo.is" || finalHost?.includes("folo-ssr-dev") ? "dev" : "prod"

    // Create a req-like proxy for compatibility with existing modules
    const headers: Record<string, string> = {}
    c.req.raw.headers.forEach((value, key) => {
      headers[key] = value
    })

    const reqProxy = createRequestProxy(
      c.req.path + (c.req.raw.url.includes("?") ? `?${c.req.raw.url.split("?")[1]}` : ""),
      headers,
    )

    // Set request context values
    requestContext.set("req", reqProxy)
    requestContext.set("upstreamEnv", upstreamEnv)
    if (upstreamEnv === "prod") {
      requestContext.set("upstreamOrigin", env.VITE_WEB_PROD_URL || env.VITE_WEB_URL)
    } else {
      requestContext.set("upstreamOrigin", env.VITE_WEB_DEV_URL || env.VITE_WEB_URL)
    }

    await next()

    c.header("x-handled-host", finalHost)
  })
})

// OG image route
app.get("/og/:type/:id", async (c) => {
  const type = c.req.param("type")
  const id = c.req.param("id")

  const apiClient = createFollowClient()
  let imageRes: { image: Buffer; contentType: string } | null = null

  try {
    switch (type) {
      case "feed": {
        imageRes = await renderFeedOG(apiClient, id)
        break
      }
      case "user": {
        imageRes = await renderUserOG(apiClient, id)
        break
      }
      case "list": {
        imageRes = await renderListOG(apiClient, id)
        break
      }
      default: {
        return c.text("Not found", 404)
      }
    }
  } catch (e: any) {
    if (typeof e === "number") {
      return c.text(e === 404 ? "Not found" : "Internal server error", e)
    }
    console.error("OG render error:", e)
    return c.text(e?.message || "Internal server error", 500)
  }

  if (!imageRes) {
    return c.text("Not found", 404)
  }

  return new Response(imageRes.image, {
    headers: {
      "Content-Type": imageRes.contentType,
      "Cache-Control": "max-age=3600, s-maxage=3600, stale-while-revalidate=600",
      "Cloudflare-CDN-Cache-Control": "max-age=3600, s-maxage=3600, stale-while-revalidate=600",
      "CDN-Cache-Control": "max-age=3600, s-maxage=3600, stale-while-revalidate=600",
    },
  })
})

// SSR routes - use SSR template with meta injection
// These routes correspond to the vercel.json rewrites to follow-external-ssr
const ssrHandler = async (c: any) => {
  // @ts-ignore - dynamic import of generated template
  const template = await import("./.generated/index.template").then((m) => m.default)
  const { document } = parseHTML(template)

  // Inject meta tags
  try {
    await injectMetaToTemplate(document, c)
  } catch (e) {
    console.error("inject meta error", e)

    if (e instanceof NotFoundError) {
      c.status(404)
      document.documentElement.dataset.notFound = "true"
    } else if (e instanceof FetchError && e.response?.status) {
      c.status(e.response.status as any)
    } else if (e instanceof MetaError) {
      return c.json({ ok: false, message: e.metaMessage }, e.status as any)
    }
  }

  injectEnvToDocument(document)

  const html = await minify(document.toString(), {
    removeComments: true,
    html5: true,
    minifyJS: true,
    minifyCSS: true,
    removeTagWhitespace: true,
    collapseWhitespace: true,
    collapseBooleanAttributes: true,
    collapseInlineTagWhitespace: true,
  })

  return c.html(html)
}

app.get("/share/*", ssrHandler)
app.get("/login", ssrHandler)
app.get("/register", ssrHandler)
app.get("/forget-password", ssrHandler)
app.get("/reset-password", ssrHandler)

// SPA catch-all - fetch index.html from Assets and inject env vars
app.get("*", async (c) => {
  const assetResponse = await c.env.ASSETS.fetch(new Request("http://fakehost/index.html"))
  const spaHtml = await assetResponse.text()
  const { document } = parseHTML(spaHtml)

  injectEnvToDocument(document)

  const html = document.toString()
  return c.html(html)
})

// Error handling
app.onError((err, c) => {
  console.error(err)

  if (err instanceof FetchError) {
    return c.json({ ok: false, message: err.message }, (err.response?.status as any) || 500)
  }
  if (err instanceof MetaError) {
    return c.json({ ok: false, message: err.metaMessage }, err.status as any)
  }

  return c.json({ ok: false, message: err.message || "Internal Server Error" }, 500)
})

export default app

// Helper: inject env vars into HTML document
function injectEnvToDocument(document: any) {
  const upstreamEnv = requestContext.get("upstreamEnv") as string
  const upstreamOrigin = requestContext.get("upstreamOrigin") as string

  if (upstreamEnv) {
    document.head.prepend(document.createComment(`upstreamEnv: ${upstreamEnv}`))

    const injectScript = (apiUrl: string) => {
      const scriptContent = `function injectEnv(env2) {
    for (const key in env2) {
      if (env2[key] === void 0) continue;
      globalThis["__followEnv"] ??= {};
      globalThis["__followEnv"][key] = env2[key];
    }
  }
injectEnv({"VITE_API_URL":"${apiUrl}","VITE_EXTERNAL_API_URL":"${apiUrl}","VITE_WEB_URL":"${upstreamOrigin}"})`
      const $script = document.createElement("script")
      $script.innerHTML = scriptContent
      document.head.prepend($script)
    }
    if (upstreamEnv === "dev" && env.VITE_EXTERNAL_DEV_API_URL) {
      injectScript(env.VITE_EXTERNAL_DEV_API_URL)
    }
    if (upstreamEnv === "prod" && env.VITE_EXTERNAL_PROD_API_URL) {
      injectScript(env.VITE_EXTERNAL_PROD_API_URL)
    }
  }
}

// Helper: inject meta tags into HTML document
async function injectMetaToTemplate(document: Document, c: any) {
  // Create a req/res proxy compatible with injectMetaHandler
  const reqProxy = requestContext.get("req")
  const resProxy = {
    status(code: number) {
      c.status(code)
    },
    raw: { statusMessage: "" },
  }

  const injectMetadata = await injectMetaHandler(reqProxy as any, resProxy as any)

  if (!injectMetadata) return document

  for (const meta of injectMetadata) {
    switch (meta.type) {
      case "openGraph": {
        const $metaArray = buildSeoMetaTags(document, { openGraph: meta })
        for (const $meta of $metaArray) {
          document.head.append($meta)
        }
        break
      }
      case "meta": {
        const $oldMeta = document.querySelector(`meta[name="${meta.property}"]`)
        if ($oldMeta) {
          $oldMeta.setAttribute("content", xss(meta.content))
        } else {
          const $meta = document.createElement("meta")
          $meta.setAttribute("name", meta.property)
          $meta.setAttribute("content", xss(meta.content))
          document.head.append($meta)
        }
        break
      }
      case "title": {
        if (meta.title) {
          const $title = document.querySelector("title")
          if ($title) {
            $title.textContent = `${xss(meta.title)} | Folo`
          } else {
            const $head = document.querySelector("head")
            if ($head) {
              const $title = document.createElement("title")
              $title.textContent = `${xss(meta.title)} | Folo`
              $head.append($title)
            }
          }
        }
        break
      }
      case "description": {
        const $meta = document.createElement("meta")
        $meta.setAttribute("name", "description")
        $meta.setAttribute("content", xss(meta.description))
        document.head.append($meta)
        break
      }
      case "hydrate": {
        const script = document.createElement("script")
        script.innerHTML = `
          window.__HYDRATE__ = window.__HYDRATE__ || {}
          window.__HYDRATE__[${JSON.stringify(meta.key)}] = JSON.parse(${JSON.stringify(JSON.stringify(meta.data))})
        `
        document.head.append(script)
        break
      }
    }
  }

  return document
}
