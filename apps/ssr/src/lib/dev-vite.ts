import { resolve } from "node:path"

import type { FastifyInstance } from "fastify"
import type { ViteDevServer } from "vite"
import { createServer as createViteServer } from "vite"

const root = resolve(__dirname, "../..")

let globalVite: ViteDevServer
export const registerDevViteServer = async (app: FastifyInstance) => {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",

    configFile: resolve(root, "vite.config.mts"),
    envDir: root,
  })
  globalVite = vite

  // @ts-ignore
  app.use(vite.middlewares)
  return vite
}

export const getViteServer = () => {
  return globalVite
}
