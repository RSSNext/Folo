//
//  SharedWebView+BridgeData.swift
//  Pods
//
//  Created by Innei on 2025/2/7.
//
import Foundation
import UIKit

private protocol BasePayload {
  var type: String { get }
}

struct SetContentHeightPayload: Codable, BasePayload {
  var type: String
  var payload: CGFloat
}

struct BridgeDataBasePayload: Codable {
  var type: String
}

struct PreviewImagePayloadProps: Codable {
  var imageUrls: [String]
  var index: Int = 0
}

struct PreviewImagePayload: Codable, BasePayload {
  var type: String
  var payload: PreviewImagePayloadProps
}

struct AudioSeekPayloadProps: Codable {
    let time: Double
}

struct AudioSeekPayload: Codable, BasePayload {
    var type: String
    var payload: AudioSeekPayloadProps
}