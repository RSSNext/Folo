import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface CheckFilledIconProps {
  width?: number
  height?: number
  color?: string
}

export const CheckFilledIcon = ({
  width = 24,
  height = 24,
  color = "#10161F",
}: CheckFilledIconProps) => {
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24">
      <Path
        d="M20.051 4.736c-.092.03-.245.101-.34.157-.094.056-2.502 2.434-5.35 5.284l-5.18 5.182-2.4-2.393c-2.122-2.114-2.429-2.406-2.638-2.502a1.531 1.531 0 0 0-1.458.096 1.49 1.49 0 0 0-.528 1.898c.104.211.508.629 3.171 3.287 2.929 2.923 3.062 3.049 3.29 3.133.246.09.645.117.905.062.406-.086.341-.023 6.384-6.071 6.252-6.256 5.979-5.964 6.044-6.459.092-.702-.237-1.314-.862-1.6-.276-.127-.769-.162-1.038-.074"
        fill={color}
        fillRule="evenodd"
      />
    </Svg>
  )
}
