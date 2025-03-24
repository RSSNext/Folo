//
//  FeedIconView.swift
//
//  Created by Innei on 2025/3/24.
//

import SwiftUI

struct FeedIconView: View {
  var feed: FeedIconFeedData?
  var fallbackUrl: String?
  var size: CGFloat = 20
  var fallback: Bool = true
  var siteUrl: String?

  var body: some View {
    if let iconSource = getFeedIconSource() {
      AsyncImage(url: URL(string: iconSource)) { phase in
        switch phase {
        case .empty:
          RoundedRectangle(cornerRadius: CGFloat(4), style: .continuous)
            .fill(Color.gray.opacity(0.5))
            .frame(width: size, height: size)
        case .success(let image):
          image
            .resizable()
            .aspectRatio(contentMode: .fill)
            .frame(width: size, height: size)
            .clipShape(RoundedRectangle(cornerRadius: 4))
        case .failure:
          let fallbackTitle = feed?.title ?? extractDomainFromUrl(siteUrl ?? fallbackUrl ?? "")
          FallbackIcon(title: fallbackTitle, size: size)

        @unknown default:
          RoundedRectangle(cornerRadius: CGFloat(4), style: .continuous)
            .fill(Color.gray.opacity(0.5))
            .frame(width: size, height: size)
        }
      }
      .frame(width: size, height: size)
    } else {
      let fallbackTitle = feed?.title ?? extractDomainFromUrl(siteUrl ?? fallbackUrl ?? "")
      FallbackIcon(title: fallbackTitle, size: size)

    }
  }

  private func getFeedIconSource() -> String? {
    switch true {
    case feed == nil && siteUrl != nil:
      return getUrlIcon(url: siteUrl!, fallback: fallback).src
    case feed != nil && feed?.image != nil && !(feed?.image?.isEmpty ?? true):
      return feed?.image
    case feed != nil && (feed?.image == nil || feed?.image?.isEmpty ?? true)
      && feed?.siteUrl != nil:
      return getUrlIcon(url: feed!.siteUrl!, fallback: fallback).src
    default:
      return nil
    }
  }

  private func getUrlIcon(url: String, fallback: Bool) -> (src: String, fallbackUrl: String) {
    var src: String
    var fallbackUrl = ""

    if let urlObj = URL(string: url), let host = urlObj.host {
      let pureDomain = extractDomainFromUrl(host)
      fallbackUrl =
        "https://avatar.vercel.sh/\(pureDomain).svg?text=\(pureDomain.prefix(2).uppercased())"
      src = "https://unavatar.webp.se/\(host)?fallback=\(fallback)"
    } else {
      let pureDomain = extractDomainFromUrl(url)
      src = "https://avatar.vercel.sh/\(pureDomain).svg?text=\(pureDomain.prefix(2).uppercased())"
    }

    return (src, fallbackUrl)
  }

  private func extractDomainFromUrl(_ url: String) -> String {
    // Simple domain extraction - in a real app you'd want to use a more robust solution
    let components = url.components(separatedBy: ".")
    if components.count >= 2 {
      return components[components.count - 2]
    }
    return url
  }
}

// Feed data model
struct FeedIconFeedData: Identifiable {
  var id: String

  var title: String
  var url: String
  var image: String?
  var siteUrl: String?

  static func transform(_ feed: ProfileFeed) -> FeedIconFeedData {
    FeedIconFeedData(
      id: feed.id,
      title: feed.title,
      url: feed.url,
      image: feed.image,
      siteUrl: feed.siteUrl
    )
  }

  #if DEBUG
    static var mockData: FeedIconFeedData {
      FeedIconFeedData(
        id: "1",

        title: "Example Feed",
        url: "https://example.com/feed",
        image: nil,
        siteUrl: "https://example.com"

      )
    }
  #endif
}

#Preview {
  VStack(spacing: 20) {
    // Feed with image
    FeedIconView(
      feed: FeedIconFeedData(
        id: "1",
        title: "Example Feed",
        url: "https://example.com/feed",
        image: "https://picsum.photos/200",
        siteUrl: "https://example.com"
      ),
      size: 40
    )

    // Feed without image, using site URL
    FeedIconView(
      feed: FeedIconFeedData(
        id: "2",
        title: "No Image Feed",
        url: "https://noimage.com/feed",
        image: nil,
        siteUrl: "https://noimage.com"
      ),
      size: 40
    )

    // Just a site URL
    FeedIconView(
      size: 40, siteUrl: "https://github.com"
    )

    // Fallback
    FeedIconView(
      feed: FeedIconFeedData(
        id: "3",
        title: "Fallback Example",
        url: "https://invalid-url",
        image: nil,
        siteUrl: nil
      ),
      size: 40
    )
  }
  .padding()
}
