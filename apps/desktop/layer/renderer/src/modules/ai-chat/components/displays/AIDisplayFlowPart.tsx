import "@xyflow/react/dist/style.css"

import { useIsDark } from "@follow/hooks"
import { thenable } from "@follow/utils"
import { cn } from "@follow/utils/utils"
import type { ToolWithState } from "@folo-services/ai-tools"
import { Background, Controls, ReactFlow } from "@xyflow/react"
import { useCallback } from "react"

import { useModalStack } from "~/components/ui/modal/stacked/hooks"

import { toolMemo } from "./share"

const FlowPreviewModal = ({
  nodes,
  edges,
  colorMode,
}: {
  nodes: any[]
  edges: any[]
  colorMode: "light" | "dark"
}) => {
  return (
    <div className="flex size-full flex-col">
      <ReactFlow
        colorMode={colorMode}
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable={true}
        nodesConnectable={false}
        nodesFocusable={true}
        edgesFocusable={true}
        elementsSelectable={true}
        preventScrolling={false}
        className="size-full"
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}

export const AIDisplayFlowPart = toolMemo(({ part }: { part: ToolWithState<any> }) => {
  if (!part.input) throw thenable
  if (part.state === "input-streaming") {
    throw thenable
  }

  // `part.input.flowChart` to make compatible with old data
  const { nodes, edges } = part.input.flowChart || (part.input.schema.flowChart as any)
  const colorMode = useIsDark() ? "dark" : "light"
  const { present } = useModalStack()

  const handleOpenModal = useCallback(() => {
    present({
      title: "Flow Chart Preview",
      content: () => <FlowPreviewModal nodes={nodes} edges={edges} colorMode={colorMode} />,
      max: true,
      canClose: true,
      clickOutsideToDismiss: false,
      modalContentClassName: "p-0 h-full",
      modalClassName: "h-[90vh] w-[90vw]",
    })
  }, [nodes, edges, colorMode, present])

  return (
    <div className="group relative my-2 aspect-[4/3] w-[calc(var(--ai-chat-message-container-width,65ch))] max-w-full overflow-hidden rounded-md">
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
        preventScrolling={false}
      >
        <Background />
        <Controls />
      </ReactFlow>

      {/* Expand/Preview button */}
      <button
        type="button"
        onClick={handleOpenModal}
        className={cn(
          "absolute right-2 top-2 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5",
          "bg-material-thick text-sm font-medium text-text-secondary",
          "opacity-0 transition-all duration-200 group-hover:opacity-100",
          "hover:bg-material-medium hover:text-text focus:opacity-100",
          "focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-1",
        )}
        title="Open in full screen"
      >
        <i className="i-mgc-external-link-cute-re size-4" />
        <span>Preview</span>
      </button>
    </div>
  )
})
