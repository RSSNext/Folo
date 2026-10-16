// App Store custom product pages. Each one reorders the iPhone and iPad
// screenshots for one search intent. Its promotional text and the keywords it
// takes over from the app's keyword field (searches for them show this page
// instead of the default one) live in listing/<locale>/app-store.json under
// customPages.<id>.
export interface CustomPageSpec {
  id: string
  // Only shown in App Store Connect.
  name: string
  // Screenshot files from output/app-store/<device>/<store locale>, in page order.
  slides: string[]
}

export const customPages: CustomPageSpec[] = [
  {
    id: "ai",
    name: "AI Reading",
    slides: [
      "02-summary",
      "03-translate",
      "01-hero",
      "05-listen",
      "04-formats",
      "06-discover",
      "07-sync",
      "08-more",
    ],
  },
  {
    id: "media",
    name: "Podcasts & Video",
    slides: [
      "04-formats",
      "05-listen",
      "01-hero",
      "02-summary",
      "03-translate",
      "06-discover",
      "07-sync",
      "08-more",
    ],
  },
  {
    id: "rss",
    name: "RSS & RSSHub",
    slides: [
      "01-hero",
      "06-discover",
      "07-sync",
      "02-summary",
      "03-translate",
      "04-formats",
      "05-listen",
      "08-more",
    ],
  },
]
