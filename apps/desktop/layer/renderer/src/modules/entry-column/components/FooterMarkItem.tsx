import { FeedViewType, views } from "@follow/constants"

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
  } else if (views[view]!.gridMode) {
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
    <div className="relative flex w-full">
      <FlatMarkAllReadButton
        className="justify-center"
        buttonClassName="w-[645px] mx-auto mb-4 pl-7 py-4"
        iconClassName="mr-1 text-lg"
        which="above"
        filter={filter}
      />
    </div>
  )
}

const GridFooterMarkItem = ({ filter }: FooterMarkItemProps) => {
  return (
    <div className="relative flex w-full">
      <FlatMarkAllReadButton
        buttonClassName="w-full py-4"
        iconClassName="mr-1 text-base"
        which="above"
        filter={filter}
      />
    </div>
  )
}

const CommonFooterMarkItem = ({ filter }: FooterMarkItemProps) => {
  return (
    <FlatMarkAllReadButton
      className="justify-start"
      buttonClassName="w-full rounded-none px-6 py-4"
      iconClassName="mr-1 text-base"
      which="above"
      filter={filter}
    />
  )
}
