//
//  ProfileView.swift
//
//  Created by Innei on 2025/3/24.
//

import ExpoModulesCore
import SwiftUI

struct ProfileView: View {
    @Binding var profile: ProfileData
    @Binding var user: UserData
   let onPress: EventDispatcher

    var hasAnyFeeds: Bool {
        !profile.feeds.isEmpty || !profile.groupedFeeds.isEmpty
    }

    var body: some View {

        List {
            VStack {
                VStack {
                    ProfileAvatar(image: user.image, name: user.name)
                    Text(user.name)
                        .font(.title)
                        .fontWeight(.bold)
                        .lineLimit(1)

                    if !user.handle.isEmpty {
                        Text("@\(user.handle)")
                            .foregroundColor(.gray)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.top, 30)
                .padding(.bottom, 20)
                .listRowInsets(EdgeInsets())
                .listRowSeparator(.hidden)

            }.listRowInsets(.none)

            if !profile.lists.isEmpty {

                Section(header: SectionHeaderText(text: "Lists")) {
                    ForEach($profile.lists, id: \.id) { $list in
                        Button {
                            onPress(["type": "list", "id": list.id])
                        } label: {
                            HStack {
                                ProfileListImage(
                                    image: list.image, title: list.title,
                                    customTitle: list.customTitle)

                                ProfileItemTitle(title: list.title, customTitle: list.customTitle)
                            }

                        }.foregroundStyle(.foreground)
                    }
                }

            }

            if hasAnyFeeds {
                Section(header: SectionHeaderText(text: "Feeds")) {
                }
            }

            ForEach(profile.groupedFeeds.sorted(by: { $0.key < $1.key }), id: \.key) { key, value in

                Section(
                    header:
                        Text(key).textCase(.none)
                ) {
                    ForEach(value, id: \.id) { feed in
                        Button {
                            onPress(["type": "feed", "id": feed.id])

                        } label: {
                            HStack {
                                FeedIconView(
                                    feed: FeedIconFeedData.transform(feed), size: 24,
                                    fallback: true,
                                    siteUrl: feed.siteUrl
                                )

                                ProfileItemTitle(title: feed.title, customTitle: feed.customTitle)
                            }
                        }.foregroundStyle(.foreground)
                    }
                }
            }

            if !profile.feeds.isEmpty {
                Section(header: Text("Uncategorized Feeds").textCase(.none)) {
                    ForEach($profile.feeds, id: \.id) { $feed in
                        Button {
                            onPress(["type": "feed", "id": feed.id])
                        } label: {
                            HStack {
                                FeedIconView(
                                    feed: FeedIconFeedData.transform(feed), size: 24,
                                    fallback: true,
                                    siteUrl: feed.siteUrl
                                )

                                ProfileItemTitle(title: feed.title, customTitle: feed.customTitle)
                            }

                        }.foregroundStyle(.foreground)
                    }
                }
            }

        }.listStyle(.insetGrouped)
            .listSectionSpacing(0)

    }
}

private struct ProfileListImage: View {
    var image: String?
    var title: String
    var customTitle: String?
    var body: some View {
        if let image = image, !image.isEmpty {
            Image(systemName: image)
                .frame(width: 24, height: 24)
        } else {
            // Fallback icon with gradient background based on title
            FallbackIcon(title: customTitle ?? title, size: 24)
        }
    }
}


private struct SectionHeaderText: View {
    let text: String

    var body: some View {
        Text(text).font(.headline).foregroundStyle(.black).textCase(.none).padding(.top, 20)
    }
}

private struct ProfileItemTitle: View {
    let title: String
    let customTitle: String?

    var body: some View {
        if let customTitle = customTitle, !customTitle.isEmpty {
            Text(customTitle).lineLimit(1)
        } else {
            Text(title).lineLimit(1)
        }
    }
}

private struct ProfileAvatar: View {
    let image: String?
    let name: String
    var body: some View {
        AsyncImage(url: URL(string: image ?? "")) { phase in
            switch phase {
            case .empty:
                ProgressView()
            case .success(let image):
                image
                    .resizable()
                    .scaledToFill()
            case .failure:
                FallbackIcon(title: name, size: 80)
            @unknown default:
                FallbackIcon(title: name, size: 80)
            }
        }

        .scaledToFill()
        .frame(width: 80, height: 80)
        .clipShape(Circle())

    }
}
