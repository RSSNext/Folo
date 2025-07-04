import { FeedViewType, views } from "@follow/constants"

import { useRouteParams } from "~/hooks/biz/useRouteParams"

import { FlatMarkAllReadButton } from "./mark-all-button"

export const FooterMarkItem = ({ view }: { view: FeedViewType }) => {
  if (useRouteParams().isCollection) {
    return null
  } else if (view === FeedViewType.SocialMedia) {
    return <SocialMediaFooterMarkItem />
  } else if (views[view]!.gridMode) {
    return <GridFooterMarkItem />
  }
  return <CommonFooterMarkItem />
}

const SocialMediaFooterMarkItem = () => {
  return (
    <div className="relative flex w-full">
      <FlatMarkAllReadButton
        className="justify-center"
        buttonClassName="w-[645px] mx-auto mb-4 pl-7 py-4"
        iconClassName="mr-1 text-lg"
        which="above"
      />
    </div>
  )
}

const GridFooterMarkItem = () => {
  return (
    <div className="relative flex w-full">
      <FlatMarkAllReadButton
        buttonClassName="w-full py-4"
        iconClassName="mr-1 text-base"
        which="above"
      />
    </div>
  )
}

const CommonFooterMarkItem = () => {
  return (
    <FlatMarkAllReadButton
      className="justify-start"
      buttonClassName="w-full rounded-none px-6 py-4"
      iconClassName="mr-1 text-base"
      which="above"
    />
  )
}
