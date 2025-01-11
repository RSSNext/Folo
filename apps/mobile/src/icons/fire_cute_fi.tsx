import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface FireCuteFiIconProps {
  width?: number
  height?: number
  color?: string
}

export const FireCuteFiIcon = ({
  width = 24,
  height = 24,
  color = "#10161F",
}: FireCuteFiIconProps) => {
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24">
      <Path fill="#fff" fillOpacity={0.01} d="M24 0v24H0V0z" />
      <Path
        fill={color}
        fillRule="evenodd"
        d="M10.938 2.785c.592-.227 1.333-.18 1.913.347a8.094 8.094 0 0 1 2.276 3.533c.226-.188.492-.324.783-.39a1.767 1.767 0 0 1 1.787.626 18.24 18.24 0 0 1 2.197 3.42C20.52 11.612 21 13.07 21 14.502c0 1.778-.36 3.454-1.369 4.793-1.023 1.357-2.607 2.228-4.77 2.595-1.103.188-1.87-.817-1.71-1.747.249-1.44.074-2.068-.148-2.497-.131-.253-.302-.481-.55-.807l-.013-.017c-.235-.31-.523-.688-.795-1.166a.286.286 0 0 0-.11-.108c-1.056.844-1.497 1.606-1.658 2.246-.164.655-.07 1.318.19 2.018.192.513.094 1.066-.213 1.469a1.43 1.43 0 0 1-1.51.52c-2.341-.613-4.517-2.394-5.25-4.847-.758-2.54.11-5.486 3.251-8.209.868-.751 2.557-2.532 3.337-4.67a2.186 2.186 0 0 1 1.256-1.289"
        clipRule="evenodd"
      />
    </Svg>
  )
}
