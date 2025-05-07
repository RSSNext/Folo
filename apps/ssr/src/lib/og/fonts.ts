import fs from "node:fs"
import path, { resolve } from "node:path"

const weights = [
  {
    name: "Thin",
    weight: 100,
  },
  {
    name: "ExtraLight",
    weight: 200,
  },
  {
    name: "Light",
    weight: 300,
  },
  {
    name: "Regular",
    weight: 400,
  },
  {
    name: "Italic",
    weight: 400,
  },
  {
    name: "Medium",
    weight: 500,
  },
  {
    name: "SemiBold",
    weight: 600,
  },
  {
    name: "Bold",
    weight: 700,
  },
  {
    name: "ExtraBold",
    weight: 800,
  },
  {
    name: "Black",
    weight: 900,
  },
] as const
let fontsData = [] as any[]

const snFontDepsPath = require.resolve("@fontsource/sn-pro")
const snFontsDirPath = resolve(snFontDepsPath, "../files")
const snFontsDir = fs
  .readdirSync(snFontsDirPath)
  .filter((name) => !name.endsWith(".woff2") && !name.includes("italic"))

fontsData = snFontsDir.map((file) => {
  const weight = weights.find((weight) => file.includes(weight.weight.toString()))
  if (!weight) {
    return null
  }
  return {
    name: `SN Pro`,
    data: fs.readFileSync(path.join(snFontsDirPath, file)),
    weight: weight.weight,
    style: file.includes("Italic") ? "italic" : ("normal" as "italic" | "normal"),
  }
})

const koseFontPath = require.resolve("kose-font")

const koseFontData = fs.readFileSync(koseFontPath)

fontsData.push({
  name: "Kose",
  data: koseFontData,
  weight: 400,
  style: "normal" as "italic" | "normal",
})

// if (isDev) {
//   const fontDepsPath = require.resolve("@fontsource/sn-pro")
//   const fontsDirPath = resolve(fontDepsPath, "../files")
//   const fontsDir = fs
//     .readdirSync(fontsDirPath)
//     .filter((name) => !name.endsWith(".woff2") && !name.includes("italic"))

//   fontsData = fontsDir.map((file) => ({
//     name: file.split("-")[0],
//     data: fs.readFileSync(path.join(fontsDirPath, file)),
//     weight: weights.find((weight) => weight.name === file.split("-")[1])?.weight,
//     style: file.includes("Italic") ? "italic" : ("normal" as "italic" | "normal"),
//   }))
// } else {
//   const { default: fontsBase64Data } = require("../../.generated/fonts-data")

//   for (const fontName in fontsBase64Data) {
//     fontsData.push({
//       name: fontName.split("-")[0],
//       weight: weights.find((weight) => weight.name === fontName.split("-")[1])?.weight,
//       style: fontName.includes("Italic") ? "italic" : ("normal" as "italic" | "normal"),
//       data: Buffer.from(fontsBase64Data[fontName], "base64"),
//     })
//   }
// }

export default fontsData
