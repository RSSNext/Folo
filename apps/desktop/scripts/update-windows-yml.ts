import crypto from "node:crypto"
import fs from "node:fs"
import { fileURLToPath, resolve } from "node:url"

import yaml from "js-yaml"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const basePath = resolve(__dirname, "../out/make/squirrel.windows/x64/")
const ymlPath = resolve(basePath, "./latest.yml")

const yml = yaml.load(fs.readFileSync(ymlPath, "utf8")) as {
  version?: string
  files: {
    url: string
    sha512: string
    size: number
  }[]
  releaseDate?: string
}

const file = yml.files[0].url

const fileData = fs.readFileSync(resolve(basePath, file))
const hash = crypto.createHash("sha512").update(fileData).digest("base64")
const { size } = fs.statSync(resolve(basePath, file))

yml.files[0].sha512 = hash
yml.files[0].size = size

yml.releaseDate = new Date().toISOString()

const ymlStr = yaml.dump(yml, {
  lineWidth: -1,
})
fs.writeFileSync(ymlPath, ymlStr)
