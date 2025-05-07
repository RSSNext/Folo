const { createApp } = require("../dist/server/index.js")

// export const config = {
//   runtime: "nodejs", // this is a pre-requisite
// }

module.exports = async function handler(req: any, res: any) {
  const app = await createApp()
  await app.ready()
  app.server.emit("request", req, res)
}
