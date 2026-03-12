import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { env } from "@follow/shared/env.ssr"
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { minify } from "html-minifier-terser"
import { parseHTML } from "linkedom"
import { FetchError } from "ofetch"
import path, { dirname, resolve } from "pathe"
import xss from "xss"

import { NotFoundError } from "../lib/not-found"
import { buildSeoMetaTags } from "../lib/seo"
import { injectMetaHandler, MetaError } from "../meta-handler"

const devHandler = (app: FastifyInstance) => {
  app.get("*", async (req, reply) => {
    const url = req.originalUrl
    const __dirname = dirname(fileURLToPath(import.meta.url))

    const root = resolve(__dirname, "../..")

    const vite = await import("../lib/dev-vite").then((m) => m.getViteServer())
    try {
      let template = readFileSync(path.resolve(root, vite.config.root, "index.html"), "utf-8")
      template = await vite.transformIndexHtml(url, template)
      const { document } = parseHTML(template)
      await safeInjectMetaToTemplate(document, req, reply)

      reply.type("text/html")
      reply.send(document.toString())
    } catch (e) {
      vite.ssrFixStacktrace(e as Error)
      reply.code(500).send(e)
    }
  })
}
const prodHandler = (app: FastifyInstance) => {
  app.get("*", async (req, reply) => {
    // @ts-ignore
    const template = await import("../../.generated/index.template").then((m) => m.default)
    const { document } = parseHTML(template)
    await safeInjectMetaToTemplate(document, req, reply)

    const scriptContent = `function injectEnv(env2) {
    for (const key in env2) {
      if (env2[key] === void 0) continue;
      globalThis["__followEnv"] ??= {};
      globalThis["__followEnv"][key] = env2[key];
    }
  }
injectEnv({"VITE_API_URL":"${env.VITE_API_URL}","VITE_WEB_URL":"${env.VITE_WEB_URL}"})`
    const $script = document.createElement("script")
    $script.innerHTML = scriptContent
    document.head.prepend($script)

    reply.type("text/html")
    reply.send(
      await minify(document.toString(), {
        removeComments: true,
        html5: true,
        minifyJS: true,
        minifyCSS: true,
        removeTagWhitespace: true,
        collapseWhitespace: true,
        collapseBooleanAttributes: true,
        collapseInlineTagWhitespace: true,
      }),
    )
  })
}
export const globalRoute = __DEV__ ? devHandler : prodHandler

async function safeInjectMetaToTemplate(
  document: Document,
  req: FastifyRequest,
  res: FastifyReply,
) {
  try {
    return await injectMetaToTemplate(document, req, res)
  } catch (e) {
    console.error("inject meta error", e)

    if (e instanceof NotFoundError) {
      res.code(404)
      document.documentElement.dataset.notFound = "true"
      return document
    }

    if (e instanceof FetchError && e.response?.status) {
      res.code(e.response.status)
    }

    if (e instanceof MetaError) {
      throw e
    }
    return document
  }
}

async function injectMetaToTemplate(document: Document, req: FastifyRequest, res: FastifyReply) {
  const injectMetadata = await injectMetaHandler(req, res)

  if (!injectMetadata) {
    return document
  }

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
        // Find Old Meta
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
        // Insert hydrate script
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
