import type { StyleProp, ViewStyle } from "react-native"
import type { SvgProps } from "react-native-svg"
import Svg, { Path } from "react-native-svg"

import { accentColor } from "@/src/theme/colors"

export const Logo: React.FC<{ color?: string } & SvgProps> = ({ color = accentColor, ...rest }) => {
  return (
    <Svg viewBox="0 0 24 24" {...rest}>
      <title>Folo</title>
      <Path
        fill={color}
        d="M5.382 0h13.236A5.37 5.37 0 0 1 24 5.383v13.235A5.37 5.37 0 0 1 18.618 24H5.382A5.37 5.37 0 0 1 0 18.618V5.383A5.37 5.37 0 0 1 5.382.001Z"
      />
      <Path
        fill="#fff"
        d="M13.269 17.31a1.813 1.813 0 1 0-3.626.002 1.813 1.813 0 0 0 3.626-.002m-.535-6.527H7.213a1.813 1.813 0 1 0 0 3.624h5.521a1.813 1.813 0 1 0 0-3.624m4.417-4.712H8.87a1.813 1.813 0 1 0 0 3.625h8.283a1.813 1.813 0 1 0 0-3.624z"
      />
    </Svg>
  )
}

export const FollowIcon: React.FC<{ color: string; style?: StyleProp<ViewStyle> }> = ({
  color,
  style,
}) => (
  <Svg viewBox="0 0 24 24" style={style}>
    <Path
      fill={color}
      d="M20.791.455H6.136a3.207 3.207 0 0 0-3.21 3.206 3.207 3.207 0 0 0 3.21 3.206H20.79A3.207 3.207 0 0 0 24 3.66 3.21 3.21 0 0 0 20.791.455M12.977 8.79H3.209A3.207 3.207 0 0 0 0 11.997a3.207 3.207 0 0 0 3.209 3.205h9.768a3.207 3.207 0 0 0 3.209-3.205 3.207 3.207 0 0 0-3.21-3.207m.945 11.55a3.207 3.207 0 0 0-3.21-3.207 3.207 3.207 0 0 0-3.208 3.206 3.207 3.207 0 0 0 3.209 3.206 3.207 3.207 0 0 0 3.209-3.206"
    />
  </Svg>
)
