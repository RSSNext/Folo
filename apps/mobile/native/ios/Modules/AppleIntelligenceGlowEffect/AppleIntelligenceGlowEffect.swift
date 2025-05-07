// AppleIntelligenceGlowEffect
//
// https://github.com/jacobamobin/AppleIntelligenceGlowEffect/blob/main/IOS.swift
//
import SwiftUI

struct GlowEffect: View {
    @State private var gradientStops: [Gradient.Stop] = GlowEffect.generateGradientStops()

    var body: some View {
        ZStack {
            EffectNoBlur(gradientStops: gradientStops, width: 6)
                .onAppear {
                    // Start a timer to update the gradient stops every second
                    Timer.scheduledTimer(withTimeInterval: 0.4, repeats: true) { _ in
                        withAnimation(.easeInOut(duration: 0.5)) {
                            gradientStops = GlowEffect.generateGradientStops()
                        }
                    }
                }
            Effect(gradientStops: gradientStops, width: 9, blur: 4)
                .onAppear {
                    // Start a timer to update the gradient stops every second
                    Timer.scheduledTimer(withTimeInterval: 0.4, repeats: true) { _ in
                        withAnimation(.easeInOut(duration: 0.6)) {
                            gradientStops = GlowEffect.generateGradientStops()
                        }
                    }
                }
            Effect(gradientStops: gradientStops, width: 11, blur: 12)
                .onAppear {
                    // Start a timer to update the gradient stops every second
                    Timer.scheduledTimer(withTimeInterval: 0.4, repeats: true) { _ in
                        withAnimation(.easeInOut(duration: 0.8)) {
                            gradientStops = GlowEffect.generateGradientStops()
                        }
                    }
                }
            Effect(gradientStops: gradientStops, width: 15, blur: 15)
                .onAppear {
                    // Start a timer to update the gradient stops every second
                    Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { _ in
                        withAnimation(.easeInOut(duration: 1)) {
                            gradientStops = GlowEffect.generateGradientStops()
                        }
                    }
                }
        }
    }

    // Function to generate random gradient stops
    static func generateGradientStops() -> [Gradient.Stop] {
        [
            Gradient.Stop(color: Color(hex: "BC82F3"), location: Double.random(in: 0...1)),
            Gradient.Stop(color: Color(hex: "F5B9EA"), location: Double.random(in: 0...1)),
            Gradient.Stop(color: Color(hex: "8D9FFF"), location: Double.random(in: 0...1)),
            Gradient.Stop(color: Color(hex: "FF6778"), location: Double.random(in: 0...1)),
            Gradient.Stop(color: Color(hex: "FFBA71"), location: Double.random(in: 0...1)),
            Gradient.Stop(color: Color(hex: "C686FF"), location: Double.random(in: 0...1)),
        ].sorted { $0.location < $1.location }
    }
}

struct Effect: View {
    var gradientStops: [Gradient.Stop]
    var width: CGFloat
    var blur: CGFloat

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 55)
                .strokeBorder(
                    AngularGradient(
                        gradient: Gradient(stops: gradientStops),
                        center: .center
                    ),
                    lineWidth: width
                )
                .frame(
                    width: UIScreen.main.bounds.width,
                    height: UIScreen.main.bounds.height
                )
                .padding(.top, -17)
                .blur(radius: blur)
        }
    }
}

struct EffectNoBlur: View {
    var gradientStops: [Gradient.Stop]
    var width: CGFloat

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 55)
                .strokeBorder(
                    AngularGradient(
                        gradient: Gradient(stops: gradientStops),
                        center: .center
                    ),
                    lineWidth: width
                )
                .frame(
                    width: UIScreen.main.bounds.width,
                    height: UIScreen.main.bounds.height
                )
                .padding(.top, -26)
        }
    }
}

extension Color {
    init(hex: String) {
        let scanner = Scanner(string: hex)
        _ = scanner.scanString("#")

        var hexNumber: UInt64 = 0
        scanner.scanHexInt64(&hexNumber)

        let r = Double((hexNumber & 0xff0000) >> 16) / 255
        let g = Double((hexNumber & 0x00ff00) >> 8) / 255
        let b = Double(hexNumber & 0x0000ff) / 255

        self.init(red: r, green: g, blue: b)
    }
}
