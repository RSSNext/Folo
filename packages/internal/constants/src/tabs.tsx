import * as React from "react"

import { FeedViewType } from "./enums"

export interface ViewDefinition {
  name:
    | "feed_view_type.all"
    | "feed_view_type.articles"
    | "feed_view_type.audios"
    | "feed_view_type.notifications"
    | "feed_view_type.pictures"
    | "feed_view_type.social_media"
    | "feed_view_type.videos"
  icon: React.JSX.Element
  className: string
  peerClassName: string
  mentionClassName: string
  backgroundClassName: string
  translation: string
  view: FeedViewType
  wideMode?: boolean
  gridMode?: boolean
  activeColor: string
  /** if it's switchable from other views to this view by user */
  switchable: boolean
}

const viewAll: ViewDefinition = {
  name: "feed_view_type.all",
  icon: <i className="i-mgc-bubble-cute-fi" />,
  className: "text-folo",
  peerClassName: "peer-checked:text-folo dark:peer-checked:text-folo",
  mentionClassName: "bg-folo/10 text-folo border-folo/20 hover:bg-folo/20 hover:border-folo/30",
  backgroundClassName: "bg-folo",
  translation: "title,description,content",
  view: FeedViewType.All,
  activeColor: "#FF5C00",
  switchable: false,
}

/**
 * Subscription views only
 */
const views: ViewDefinition[] = [
  {
    name: "feed_view_type.articles",
    icon: <i className="i-mgc-paper-cute-fi" />,
    className: "text-lime-600 dark:text-lime-500",
    peerClassName: "peer-checked:text-lime-600 dark:peer-checked:text-lime-500",
    mentionClassName:
      "bg-lime-600/10 text-lime-600 border-lime-600/20 hover:bg-lime-600/20 hover:border-lime-600/30",
    backgroundClassName: "bg-lime-600",
    translation: "title,description",
    view: FeedViewType.Articles,
    activeColor: "#FF5C00",
    switchable: true,
  },
  {
    name: "feed_view_type.social_media",
    icon: <i className="i-mgc-thought-cute-fi" />,
    className: "text-sky-600 dark:text-sky-500",
    peerClassName: "peer-checked:text-sky-600 peer-checked:dark:text-sky-500",
    mentionClassName:
      "bg-sky-600/10 text-sky-600 border-sky-600/20 hover:bg-sky-600/20 hover:border-sky-600/30",
    backgroundClassName: "bg-sky-600",
    wideMode: true,
    translation: "content",
    view: FeedViewType.SocialMedia,
    // sky-500
    activeColor: "#0ea5e9",
    switchable: true,
  },
  {
    name: "feed_view_type.pictures",
    icon: <i className="i-mgc-pic-cute-fi" />,
    className: "text-green-600 dark:text-green-500",
    peerClassName: "peer-checked:text-green-600 peer-checked:dark:text-green-500",
    mentionClassName:
      "bg-green-600/10 text-green-600 border-green-600/20 hover:bg-green-600/20 hover:border-green-600/30",
    backgroundClassName: "bg-green-600",
    gridMode: true,
    wideMode: true,
    translation: "title",
    view: FeedViewType.Pictures,
    // green-500
    activeColor: "#22c55e",
    switchable: true,
  },
  {
    name: "feed_view_type.videos",
    icon: <i className="i-mgc-video-cute-fi" />,
    className: "text-red-600 dark:text-red-500",
    peerClassName: "peer-checked:text-red-600 peer-checked:dark:text-red-500",
    mentionClassName:
      "bg-red-600/10 text-red-600 border-red-600/20 hover:bg-red-600/20 hover:border-red-600/30",
    backgroundClassName: "bg-red-600",
    gridMode: true,
    wideMode: true,
    translation: "title",
    view: FeedViewType.Videos,
    // red-500
    activeColor: "#ef4444",
    switchable: true,
  },
  {
    name: "feed_view_type.audios",
    icon: <i className="i-mgc-mic-cute-fi" />,
    className: "text-purple-600 dark:text-purple-500",
    peerClassName: "peer-checked:text-purple-600 peer-checked:dark:text-purple-500",
    mentionClassName:
      "bg-purple-600/10 text-purple-600 border-purple-600/20 hover:bg-purple-600/20 hover:border-purple-600/30",
    backgroundClassName: "bg-purple-600",
    translation: "title",
    view: FeedViewType.Audios,
    // purple-500
    activeColor: "#a855f7",
    switchable: true,
  },
  {
    name: "feed_view_type.notifications",
    icon: <i className="i-mgc-announcement-cute-fi" />,
    className: "text-yellow-600 dark:text-yellow-500",
    peerClassName: "peer-checked:text-yellow-600 peer-checked:dark:text-yellow-500",
    mentionClassName:
      "bg-yellow-600/10 text-yellow-600 border-yellow-600/20 hover:bg-yellow-600/20 hover:border-yellow-600/30",
    backgroundClassName: "bg-yellow-600",
    translation: "title",
    view: FeedViewType.Notifications,
    // yellow-500
    activeColor: "#eab308",
    switchable: true,
  },
]

const allViews = [viewAll, ...views]

export function getView(id: FeedViewType): ViewDefinition
export function getView(id: number): ViewDefinition | undefined
export function getView(id: FeedViewType | number): ViewDefinition | undefined {
  return allViews.find((view) => view.view === id)
}

export function getViewList(options: { includeAll?: boolean } = {}): ViewDefinition[] {
  const { includeAll = false } = options
  return includeAll ? allViews : views
}
