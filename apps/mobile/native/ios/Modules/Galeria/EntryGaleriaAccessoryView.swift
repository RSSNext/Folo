//
//  EntryGaleriaAccessoryView.swift
//  FollowNative
//
//  Created by Innei on 2025/3/10.
//

import ExpoModulesCore
import SwiftUI
import UIKit

final class ExpoEntryGaleriaAccessoryViewProps: ExpoSwiftUI.ViewProps {
  @Field var author: String = ""
  @Field var avatarUrl: URL?
  @Field var publishedAt: Date = .now

}

struct ExpoEntryGaleriaAccessoryView: ExpoSwiftUI.View {

  @ObservedObject var props: ExpoEntryGaleriaAccessoryViewProps

  var body: some View {
    let author = props.author
    let avatarUrl = props.avatarUrl
    let publishedAt = props.publishedAt

    EntryGaleriaAccessoryView(
      author: author, avatarUrl: avatarUrl, publishedAt: publishedAt
    )
  }

}

struct EntryGaleriaAccessoryView: View {
  var author: String
  var avatarUrl: URL? = nil
  var publishedAt: Date
  var content: String? = nil

  @State private var opacity: Double = 0

  var body: some View {

    VStack(alignment: .leading, spacing: 8) {

      HStack(spacing: 8) {

        if let avatarUrl = avatarUrl {
          AsyncImage(url: avatarUrl) { image in
            image.resizable()
              .aspectRatio(contentMode: .fill)
              .background(.gray)
          } placeholder: {
            Ellipse().background(.gray)
          }
          .frame(width: 40, height: 40)
          .clipShape(Circle())
          .overlay(
            Circle()
              .stroke(Color.gray.opacity(0.3), lineWidth: 1)
          )
        } else {
          Image(systemName: "person.circle.fill")
            .resizable()
            .frame(width: 40, height: 40)
            .foregroundColor(.gray)
        }

        // date and author
        VStack(alignment: .leading, spacing: 2) {
          Text(author)
            .font(.headline)
            .foregroundColor(.white)

          Text(publishedAt, style: .relative)
            .font(.caption)
            .foregroundColor(.gray)
        }

        Spacer()
      }
      .padding(.horizontal, 16)
      .padding(.top, 16)
      //      Spacer()

      ScrollView {
        WebViewManager.swiftUIView.frame(height: WebViewManager.state.contentHeight)
      }
      .frame(
        height: WebViewManager.state.contentHeight > 0
          ? min(WebViewManager.state.contentHeight, 100) : nil
      )
      .padding(.horizontal, 16)

      .background(
        LinearGradient(
          gradient: Gradient(colors: [Color.clear, Color.black]),
          startPoint: .top,
          endPoint: .bottom
        )
      )

      .ignoresSafeArea(.all)
      .opacity(opacity)
      .onAppear {
        WebViewManager.shared.evaluateJavaScript("setNoMedia(true)")
        withAnimation(.smooth) {
          opacity = 1.0
        }
      }
      .onDisappear {
        WebViewManager.shared.evaluateJavaScript("setNoMedia(false)")
      }

    }
    .edgesIgnoringSafeArea(.all)
  }
}
