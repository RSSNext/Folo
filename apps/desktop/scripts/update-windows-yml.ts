import crypto from "node:crypto"
import fs from "node:fs"

import yaml from "js-yaml"

const basePath = "apps/desktop/out/make/squirrel.windows/x64"
const ymlPath = `${basePath}/latest.yml`

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

const fileData = fs.readFileSync(`${basePath}/${file}`)
const hash = crypto.createHash("sha512").update(fileData).digest("base64")
const { size } = fs.statSync(`${basePath}/${file}`)

yml.files[0].sha512 = hash
yml.files[0].size = size

yml.releaseDate = new Date().toISOString()

const ymlStr = yaml.dump(yml, {
  lineWidth: -1,
})
fs.writeFileSync(ymlPath, ymlStr)
