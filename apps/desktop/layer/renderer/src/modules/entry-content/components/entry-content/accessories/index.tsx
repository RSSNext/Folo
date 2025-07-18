import type { Ref } from "react"

import type { TocRef } from "~/components/ui/markdown/components/Toc"

import { ContainerToc } from "./ContainerToc"

export type EntryContentAccessoriesRef = {
  tocRef: Ref<TocRef | null>
}
export const EntryContentAccessories = ({ ref }: { ref: EntryContentAccessoriesRef }) => {
  return (
    <>
      <ContainerToc ref={ref.tocRef} />
      {/* <EntryAIChatInput /> */}
    </>
  )
}
