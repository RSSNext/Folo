//
//  ProfileViewModule.swift
//  Pods
//
//  Created by Innei on 2025/3/24.
//
import ExpoModulesCore
import SwiftUI

public class ProfileViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ProfileView")
    Events("onPress")
    View(ExpoProfileView.self)

  }
}

public class ProfileViewProps: ExpoSwiftUI.ViewProps {
  @Field var payload: String
  let onPress = EventDispatcher()
}

struct ProfilePayload: Codable {
  var profile: ProfileData
  var user: UserData

  public static func parse(jsonString: String) -> ProfilePayload? {
    let data = jsonString.data(using: .utf8)!
    let decoder = JSONDecoder()
    return try? decoder.decode(ProfilePayload.self, from: data)
  }
}
struct ExpoProfileView: ExpoSwiftUI.View {
  @EnvironmentObject var props: ProfileViewProps
  var body: some View {
    if let payload = ProfilePayload.parse(jsonString: props.payload) {
      ProfileView(profile: .constant(payload.profile), user: .constant(payload.user), onPress: props.onPress)
    }
  }
}
