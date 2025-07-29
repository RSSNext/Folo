import SwiftUI

struct IntelligenceAnimationView: View {
  @State private var rotation: Double = 0
  @State private var shimmerPosition: CGFloat = -1.0

  private let gradientColors: [Color] = [
    .pink,
    .purple,
    .blue,
    .cyan,
    .green,
    .yellow,
    .orange,
    .red,
    .pink,
  ]

  var body: some View {
    let baseBorder = ContainerRelativeShape()
      .stroke(
        AngularGradient(
          gradient: Gradient(colors: gradientColors),
          center: .center,
          angle: .degrees(rotation)
        ),
        style: StrokeStyle(lineWidth: 10, lineCap: .round, lineJoin: .round)
      )

    let shimmer = LinearGradient(
      gradient: Gradient(colors: [
        Color.clear,
        Color.white.opacity(0.8),
        Color.clear,
      ]),
      startPoint: .init(x: shimmerPosition, y: 0.5),
      endPoint: .init(x: shimmerPosition + 0.5, y: 0.5)
    )

    ZStack {
      baseBorder
        .overlay(
          baseBorder
            .brightness(0.3)
            .mask(shimmer)
        )
        .blur(radius: 10)
        .opacity(0.8)
        .scaleEffect(1.02)  // A bit larger than the screen to avoid clipping
        .transition(.scale(scale: 1.2).combined(with: .opacity))
        .onAppear {
          // Start rotation animation
          withAnimation(.linear(duration: 8).repeatForever(autoreverses: false)) {
            rotation = 360
          }

          // Start shimmer animation
          withAnimation(
            .linear(duration: 3)
              .repeatForever(autoreverses: false)
              .delay(1)
          ) {
            shimmerPosition = 1.5
          }
        }
    }
    .ignoresSafeArea()
  }
}
