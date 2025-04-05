import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface AlertCuteFiIconProps {
  width?: number
  height?: number
  color?: string
}

export const AlertCuteFiIcon = ({
  width = 24,
  height = 24,
  color = "#10161F",
}: AlertCuteFiIconProps) => {
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24">
      <Path
        fill={color}
        fillRule="evenodd"
        d="M8.597 4.49C9.534 3.377 10.584 2.63 12 2.63c1.415 0 2.465.747 3.402 1.862.897 1.066 1.824 2.63 2.972 4.567.284.48.562.962.835 1.447 1.104 1.963 1.995 3.547 2.47 4.858.496 1.368.619 2.651-.089 3.877s-1.88 1.761-3.314 2.016c-1.372.243-3.19.264-5.442.29-.556.006-1.112.006-1.668 0-2.253-.026-4.07-.047-5.443-.29C4.29 21 3.118 20.466 2.41 19.24c-.708-1.226-.586-2.509-.09-3.877.476-1.31 1.367-2.895 2.47-4.858.274-.486.552-.968.836-1.446C6.774 7.12 7.7 5.558 8.597 4.49M12 8a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0V9a1 1 0 0 1 1-1m0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2"
        clipRule="evenodd"
      />
    </Svg>
  )
}
