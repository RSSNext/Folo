//
//  UserData.swift
//  SwiftUIDemo
//
//  Created by Innei on 2025/3/24.
//

import Foundation

struct UserData: Codable {
  var id: String
  var name: String
  var email: String
  var emailVerified: Bool
  var image: String
  var createdAt: String
  var updatedAt: String
  var twoFactorEnabled: Bool
  var isAnonymous: Bool?
  var handle: String

  static var mockData: UserData {
      
    let decoder = JSONDecoder()
    guard let url = Bundle.main.url(forResource: "User", withExtension: "json"),
      let data = try? Data(contentsOf: url),
      let profileData = try? decoder.decode(UserData.self, from: data)
    else {
      // Return empty data if decoding fails
      return UserData(
        id: "", name: "", email: "", emailVerified: false, image: "", createdAt: "", updatedAt: "",
        twoFactorEnabled: false, isAnonymous: false, handle: "")
    }
    return profileData
  }

}
