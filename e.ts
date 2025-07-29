import fs from "node:fs"

const version = "test"
fs.appendFileSync(process.env.GITHUB_ENV, `version=${version}\n`)
