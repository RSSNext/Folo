// @ts-ignore
// eslint-disable-next-line antfu/no-import-dist
import { createApp } from "../dist/server/index.js"

export default async function handler(req: any, res: any) {
  const app = await createApp()
  await app.ready()
  app.server.emit("request", req, res)
}
