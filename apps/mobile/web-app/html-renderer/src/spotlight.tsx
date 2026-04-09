import type { SpotlightRule } from "@follow/shared/spotlight"
import { applySpotlightToHast } from "@follow/utils/html"
import type { Element, Parent, Root } from "hast"

const mobileSpotlightStyle = (color: string) =>
  `background-color:${color}CC;border-radius:5px;padding-inline:2px;`

const deepenSpotlightStylesForMobile = (tree: Parent) => {
  if (!Array.isArray(tree.children)) return

  for (const child of tree.children) {
    if (child.type !== "element") continue

    const element = child as Element
    const spotlightColor = element.properties?.["data-spotlight-color"]

    if (typeof spotlightColor === "string") {
      element.properties = {
        ...element.properties,
        style: mobileSpotlightStyle(spotlightColor),
      }
    }

    deepenSpotlightStylesForMobile(element)
  }
}

export const applySpotlightToHtmlRendererTree = (tree: Root, rules: SpotlightRule[]) => {
  applySpotlightToHast(tree, rules)
  deepenSpotlightStylesForMobile(tree)
}
