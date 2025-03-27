import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface HeartCuteFiIconProps {
  width?: number
  height?: number
  color?: string
}

export const HeartCuteFiIcon = ({
  width = 24,
  height = 24,
  color = "#10161F",
}: HeartCuteFiIconProps) => {
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24">
      <Path
        d="M7.72 3.042c-.6.075-1.338.304-1.907.591-.722.365-1.602 1.092-2.16 1.786-1.393 1.732-1.96 4.187-1.471 6.368.575 2.56 2.552 4.967 5.98 7.277 1.563 1.054 2.129 1.342 2.976 1.515.424.087 1.3.087 1.724 0 .841-.172 1.422-.468 2.976-1.515 2.094-1.412 3.732-2.945 4.717-4.419 1.271-1.899 1.7-3.909 1.284-6.005-.557-2.805-2.664-5.04-5.228-5.546-.248-.05-.544-.07-1.011-.069-1.163.001-1.852.21-3.133.95-.215.124-.427.225-.472.225-.046 0-.25-.098-.453-.218-.841-.495-1.394-.726-2.073-.865-.47-.096-1.295-.132-1.749-.075"
        fill={color}
        fillRule="evenodd"
      />
    </Svg>
  )
}
