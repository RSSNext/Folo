import { FeedViewType, getView } from "@follow/constants"

import { readableContentMaxWidthClassName } from "~/constants/ui"

import { FlatMarkAllReadButton } from "./mark-all-button"

export const FooterMarkItem = ({
  view,
  fetchedTime,
}: {
  view: FeedViewType
  fetchedTime?: number
}) => {
  const filter = fetchedTime
    ? {
        insertedBefore: fetchedTime,
      }
    : undefined

  if (view === FeedViewType.SocialMedia) {
    return <SocialMediaFooterMarkItem filter={filter} />
  } else if (getView(view)?.gridMode || view === FeedViewType.All) {
    return <GridFooterMarkItem filter={filter} />
  }
  return <CommonFooterMarkItem filter={filter} />
}

interface FooterMarkItemProps {
  filter?: {
    insertedBefore: number
  }
}

const SocialMediaFooterMarkItem = ({ filter }: FooterMarkItemProps) => {
  return (
    <div className="relative flex w-full flex-col items-center">
      <FlatMarkAllReadButton
        className="justify-center"
        buttonClassName="w-[645px] mx-auto mb-4 pl-4 py-4 @[700px]:pl-6"
        iconClassName="mr-1 text-lg"
        which="above"
        filter={filter}
      />
      <FooterEndIndicator className="w-[645px] max-w-full" />
    </div>
  )
}

const GridFooterMarkItem = ({ filter }: FooterMarkItemProps) => {
  return (
    <div className="relative flex w-full flex-col">
      <FlatMarkAllReadButton
        buttonClassName="w-full py-4"
        iconClassName="mr-1 text-base"
        which="above"
        filter={filter}
      />
      <FooterEndIndicator className="w-full" />
    </div>
  )
}

const CommonFooterMarkItem = ({ filter }: FooterMarkItemProps) => {
  return (
    <div className={`relative flex w-full flex-col ${readableContentMaxWidthClassName} mx-auto`}>
      <FlatMarkAllReadButton
        className="justify-start"
        buttonClassName="w-full px-4 pl-3 py-4"
        iconClassName="w-7 mr-3 text-base"
        which="above"
        filter={filter}
      />
      <FooterEndIndicator className="mx-3" />
    </div>
  )
}

const FooterEndIndicator = ({ className }: { className: string }) => (
  <div aria-hidden className={`pointer-events-none h-px bg-border/70 ${className}`} />
)
