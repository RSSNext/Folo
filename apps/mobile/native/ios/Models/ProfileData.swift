import Foundation
import ExpoModulesCore

struct ProfileData: Codable {
  var lists: [ProfileList]
  var feeds: [ProfileFeed]
  var groupedFeeds: [String: [ProfileFeed]]

  static var mockData: ProfileData {
    let decoder = JSONDecoder()
    guard let url = Bundle.main.url(forResource: "Profile", withExtension: "json"),
      let data = try? Data(contentsOf: url),
      let profileData = try? decoder.decode(ProfileData.self, from: data)
    else {
      // Return empty data if decoding fails
      return ProfileData(lists: [], feeds: [], groupedFeeds: [:])
    }
    return profileData
  }
}

struct ProfileList: Codable, Identifiable {
  var id: String
  var title: String
  var image: String?
  var description: String?
  var view: FeedViewType
  var customTitle: String?
}

struct ProfileFeed: Codable, Identifiable {
  var id: String
  var title: String
  var image: String?
  var description: String?
  var siteUrl: String
  var url: String
  var view: FeedViewType
  var customTitle: String?
}

enum FeedViewType: Int, Codable {
  case Article = 0
  case SocialMedia = 1
  case Image = 2
  case Video = 3
  case Audio = 4
  case Notification = 5
}
