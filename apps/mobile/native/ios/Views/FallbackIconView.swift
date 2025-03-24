//
//  FallbackIconView.swift
//  FollowNative
//
//  Created by Innei on 2025/3/24.
//

import SwiftUI

struct FallbackIcon: View {
    var title: String
    var size: CGFloat
    var gray: Bool = false

    var body: some View {
        ZStack {
            // Generate gradient colors based on the title
            LinearGradient(
                gradient: getGradientForTitle(title: title, gray: gray),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .frame(width: size, height: size)
            .clipShape(RoundedRectangle(cornerRadius: size * 0.2))

            // Display first character or first two characters based on if it's CJK
            Text(getDisplayText(from: title))
                .font(.system(size: size * 0.5))
                .foregroundColor(.white)
        }
    }

    private func getDisplayText(from title: String) -> String {
        guard !title.isEmpty else { return "" }

        // Check if the first character is CJK (Chinese, Japanese, Korean)
        let firstChar = title.first!
        let isCJK = isCJKCharacter(firstChar)

        if isCJK {
            return String(firstChar)
        } else {
            return title.prefix(2).uppercased()
        }
    }

    private func isCJKCharacter(_ character: Character) -> Bool {
        // Unicode ranges for CJK characters
        let cjkRanges: [ClosedRange<UInt32>] = [
            0x4E00...0x9FFF,  // CJK Unified Ideographs
            0x3040...0x309F,  // Hiragana
            0x30A0...0x30FF,  // Katakana
            0xAC00...0xD7AF,  // Hangul Syllables
        ]

        let unicodeScalar = character.unicodeScalars.first!.value
        return cjkRanges.contains { $0.contains(unicodeScalar) }
    }

    private func getGradientForTitle(title: String, gray: Bool) -> Gradient {
        if gray {
            return Gradient(colors: [Color.gray, Color.gray.opacity(0.7)])
        }

        // Simple hash function to generate consistent colors based on title
        var hash = 0
        for char in title {
            hash = ((hash << 5) &- hash) &+ Int(char.asciiValue ?? 0)
        }

        // Generate hue values between 0 and 1
        let hue = abs(Double(hash % 360) / 360.0)

        return Gradient(colors: [
            Color(hue: hue, saturation: 0.7, brightness: 0.8),
            Color(hue: hue, saturation: 0.5, brightness: 0.6),
        ])
    }
}

