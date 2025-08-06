import "@xyflow/react/dist/style.css"

import { useIsDark } from "@follow/hooks"
import { Background, ReactFlow } from "@xyflow/react"

import type { AIDisplayFlowTool } from "../../store/types"
import { toolMemo } from "./share"

export const AIDisplayFlowPart = toolMemo(
  ({ part, loadingElement }: { part: AIDisplayFlowTool; loadingElement: React.ReactNode }) => {
    if (!part.input) return loadingElement
    if (part.state === "input-streaming") {
      return loadingElement
    }

    const { nodes, edges } = part.input.flowChart as any
    const colorMode = useIsDark() ? "dark" : "light"
    return (
      <div className="my-2 aspect-[4/3] w-full overflow-hidden rounded-md">
        <ReactFlow
          colorMode={colorMode}
          nodes={nodes}
          edges={edges}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          nodesFocusable={false}
          edgesFocusable={false}
          elementsSelectable={false}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          preventScrolling={false}
        >
          <Background />
        </ReactFlow>
      </div>
    )
  },
)
