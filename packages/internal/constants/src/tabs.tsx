import * as React from "react"

import { FeedViewType } from "./enums"

export interface ViewDefinition {
  name:
    | "feed_view_type.articles"
    | "feed_view_type.audios"
    | "feed_view_type.notifications"
    | "feed_view_type.pictures"
    | "feed_view_type.social_media"
    | "feed_view_type.videos"
  icon: React.JSX.Element
  className: string
  peerClassName: string
  translation: string
  view: FeedViewType
  wideMode?: boolean
  gridMode?: boolean
  activeColor: string
}
export const views: ViewDefinition[] = [
  {
    name: "feed_view_type.articles",
    icon: <i className="i-mgc-paper-cute-fi" />,
    className: "text-folo",
    peerClassName: "peer-checked:text-folo dark:peer-checked:text-folo",
    translation: "title,description",
    view: FeedViewType.Articles,
    activeColor: "#FF5C00",
  },
  {
    name: "feed_view_type.social_media",
    icon: <i className="i-mgc-twitter-cute-fi" />,
    className: "text-sky-600 dark:text-sky-500",
    peerClassName: "peer-checked:text-sky-600 peer-checked:dark:text-sky-500",
    wideMode: true,
    translation: "content",
    view: FeedViewType.SocialMedia,
    // sky-500
    activeColor: "#0ea5e9",
  },
  {
    name: "feed_view_type.pictures",
    icon: <i className="i-mgc-pic-cute-fi" />,
    className: "text-green-600 dark:text-green-500",
    peerClassName: "peer-checked:text-green-600 peer-checked:dark:text-green-500",
    gridMode: true,
    wideMode: true,
    translation: "title",
    view: FeedViewType.Pictures,
    // green-500
    activeColor: "#22c55e",
  },
  {
    name: "feed_view_type.videos",
    icon: <i className="i-mgc-video-cute-fi" />,
    className: "text-red-600 dark:text-red-500",
    peerClassName: "peer-checked:text-red-600 peer-checked:dark:text-red-500",
    gridMode: true,
    wideMode: true,
    translation: "title",
    view: FeedViewType.Videos,
    // red-500
    activeColor: "#ef4444",
  },
  {
    name: "feed_view_type.audios",
    icon: <i className="i-mgc-mic-cute-fi" />,
    className: "text-purple-600 dark:text-purple-500",
    peerClassName: "peer-checked:text-purple-600 peer-checked:dark:text-purple-500",
    translation: "title",
    view: FeedViewType.Audios,
    // purple-500
    activeColor: "#a855f7",
  },
  {
    name: "feed_view_type.notifications",
    icon: <i className="i-mgc-announcement-cute-fi" />,
    className: "text-yellow-600 dark:text-yellow-500",
    peerClassName: "peer-checked:text-yellow-600 peer-checked:dark:text-yellow-500",
    translation: "title",
    view: FeedViewType.Notifications,
    // yellow-500
    activeColor: "#eab308",
  },
]

export const viewList = views.map((view) => view.view)
