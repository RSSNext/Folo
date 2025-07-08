import fs from "node:fs"

import path from "pathe"
import { parse } from "svg-parser"

const DIST_DIR = "apps/mobile/src/icons"

const DEFAULT_COLOR = "#10161F"
interface SvgNode {
  type: string
  tagName: string
  properties: Record<string, any>
  children?: SvgNode[]
}

const generateElement = (node: SvgNode): string => {
  const props = Object.entries(node.properties)
    .map(([key, value]) => {
      const camelKey = key.replaceAll(/-([a-z])/g, (_match, p1: string) => p1.toUpperCase())

      if (
        ["stroke", "fill"].includes(key) &&
        (!value || value === "currentColor" || value === DEFAULT_COLOR)
      ) {
        return `${camelKey}={color}`
      }

      if (typeof value === "number") {
        return `${camelKey}={${value}}`
      }

      return `${camelKey}="${value}"`
    })
    .join(" ")

  const tagName = `${node.tagName.charAt(0).toUpperCase()}${node.tagName.slice(1)}`

  return `      <${tagName} ${props} />`
}

const isPureBackgroundPath = (node: any) => {
  return (
    node.tagName === "path" &&
    node.properties.fill === "#fff" &&
    node.properties["fill-opacity"] === 0.01 &&
    node.properties.d === "M24 0v24H0V0z"
  )
}

const supportedTags = new Set(["path", "circle"])

const convertSvgToRN = (svgContent: string, componentName: string) => {
  const ast = parse(svgContent)
  const svgNode = ast.children[0] as SvgNode
  const { width, height } = svgNode.properties

  const pathElements =
    svgNode.children
      ?.filter((child) => supportedTags.has(child.tagName))
      .filter((child) => !isPureBackgroundPath(child))
      .map((node) => generateElement(node))
      .join("\n") ?? ""

  return `import * as React from "react"
import Svg, { Circle, Path } from "react-native-svg"

interface ${componentName}Props {
  width?: number
  height?: number
  color?: string
}

export const ${componentName} = ({
  width = ${width},
  height = ${height},
  ${pathElements.includes(`{color}`) ? `color = "${DEFAULT_COLOR}",` : ""}
}: ${componentName}Props) => {
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 ${width} ${height}">
${pathElements}
    </Svg>
  )
}
`
}

const processFile = (filePath: string) => {
  const svgContent = fs.readFileSync(filePath, "utf-8")
  const fileName = path.basename(filePath, ".svg")
  const componentName = `${fileName
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")}Icon`

  const rnComponent = convertSvgToRN(svgContent, componentName)

  const outputDir = path.join(process.cwd(), DIST_DIR)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const outputPath = path.join(outputDir, `${fileName}.tsx`)
  fs.writeFileSync(outputPath, rnComponent)
  // eslint-disable-next-line no-console
  console.log(`Converted ${filePath} to ${outputPath}`)
}

// 处理整个目录
const processDirectory = (dirPath: string) => {
  const files = fs.readdirSync(dirPath)
  files.forEach((file) => {
    if (file.endsWith(".svg")) {
      processFile(path.join(dirPath, file))
    }
  })
}

processDirectory(path.join(process.cwd(), "icons/mgc"))
