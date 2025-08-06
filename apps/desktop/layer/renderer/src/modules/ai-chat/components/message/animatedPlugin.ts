import type { Element, ElementContent, Root } from "hast"
import type { BuildVisitor } from "unist-util-visit"
import { visit } from "unist-util-visit"

export const animatedPlugin = () => {
  return (tree: Root) => {
    visit(tree, "element", ((node: Element) => {
      if (
        ["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "strong"].includes(node.tagName) &&
        node.children
      ) {
        const newChildren: Array<ElementContent> = []
        for (const child of node.children) {
          if (child.type === "text") {
            const segmenter = new Intl.Segmenter("zh", { granularity: "word" })
            const segments = segmenter.segment(child.value)
            const words = [...segments].map((segment) => segment.segment).filter(Boolean)
            words.forEach((word: string) => {
              newChildren.push({
                children: [{ type: "text", value: word }],
                properties: {
                  className: tw`fade-in duration-1000 ease-in-out animate-in`,
                },
                tagName: "span",
                type: "element",
              })
            })
          } else {
            newChildren.push(child)
          }
        }
        node.children = newChildren
      }
    }) as BuildVisitor<Root, "element">)
  }
}
