import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface VideoCuteReIconProps {
  width?: number
  height?: number
  color?: string
}

export const VideoCuteReIcon = ({
  width = 24,
  height = 24,
  color = "#10161F",
}: VideoCuteReIconProps) => {
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24">
      <Path
        stroke={color}
        strokeWidth={2}
        d="M2.5 11.5c0-3.771 0-5.657 1.172-6.828C4.843 3.5 6.729 3.5 10.5 3.5h3c3.771 0 5.657 0 6.828 1.172C21.5 5.843 21.5 7.729 21.5 11.5v1c0 3.771 0 5.657-1.172 6.828C19.157 20.5 17.271 20.5 13.5 20.5h-3c-3.771 0-5.657 0-6.828-1.172C2.5 18.157 2.5 16.271 2.5 12.5z"
      />
      <Path
        stroke={color}
        strokeWidth={2}
        d="M11.905 9.51c-.95-.51-1.426-.764-1.908-.486s-.499.817-.532 1.896a31.063 31.063 0 0 0 0 1.95c.034 1.077.05 1.614.533 1.893.482.278.956.023 1.904-.486a31.97 31.97 0 0 0 1.696-.98c.912-.564 1.368-.847 1.369-1.403 0-.557-.456-.84-1.368-1.406a31.033 31.033 0 0 0-1.694-.978Z"
      />
    </Svg>
  )
}
