import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface UserHeartCuteReIconProps {
  width?: number
  height?: number
  color?: string
}

export const UserHeartCuteReIcon = ({
  width = 24,
  height = 24,
  color = "#10161F",
}: UserHeartCuteReIconProps) => {
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24">
      <Path
        d="M10.4 2.044c-2.009.227-3.728 1.734-4.239 3.716-.241.933-.178 2.115.159 2.992a5.115 5.115 0 0 0 2.887 2.911c1.091.43 2.495.43 3.586 0 1.342-.528 2.43-1.641 2.906-2.975.397-1.112.383-2.416-.036-3.481-.59-1.501-1.885-2.653-3.423-3.045a5.223 5.223 0 0 0-1.84-.118m1.46 2.077a3.086 3.086 0 0 1 2.026 2.039c.135.434.135 1.246 0 1.68a3.086 3.086 0 0 1-2.046 2.046c-.434.135-1.246.135-1.68 0-.59-.184-1.053-.495-1.481-.995a3.006 3.006 0 0 1-.565-1.051c-.135-.434-.135-1.246 0-1.68.341-1.094 1.259-1.921 2.357-2.121.326-.06 1.075-.016 1.389.082m-1.5 8.906c-2.77.15-5.396 1.2-7.032 2.81-1.233 1.213-1.627 2.585-1.074 3.742.769 1.61 3.435 2.38 8.306 2.396 1.343.005 1.384.003 1.54-.081.361-.196.552-.505.552-.895 0-.304-.08-.504-.28-.704-.276-.276-.237-.27-1.892-.3-2.059-.038-3.292-.143-4.389-.374-1.199-.253-2.002-.659-2.075-1.047-.14-.747 1.31-2.08 3.039-2.794 1.389-.574 2.68-.798 4.466-.774l1.024.014.196-.121a.998.998 0 0 0 .417-1.127c-.071-.253-.392-.587-.622-.648-.355-.094-1.384-.14-2.176-.097m6.065 1.337c-1.054.142-2 1.043-2.312 2.203-.117.433-.125 1.199-.018 1.593.148.54.474 1.115.917 1.616.457.518 1.426 1.24 2.239 1.67.328.173.331.174.749.174s.421-.001.749-.174c.493-.26 1.225-.752 1.642-1.102.777-.653 1.279-1.368 1.497-2.132.126-.441.125-1.171-.003-1.651a3.064 3.064 0 0 0-1.525-1.938 2.534 2.534 0 0 0-2.15-.079l-.21.092-.21-.092a2.589 2.589 0 0 0-1.365-.18m.547 2.01c.071.03.219.131.328.226.256.222.402.28.7.28.298 0 .479-.072.708-.284.38-.349.67-.345.993.014.326.363.383.854.155 1.334-.163.342-.753.918-1.339 1.308-.255.169-.488.308-.517.308-.029 0-.262-.138-.517-.307-.583-.386-1.173-.963-1.339-1.309-.228-.479-.172-.971.154-1.333.235-.262.441-.334.674-.237"
        fill={color}
        fillRule="evenodd"
      />
    </Svg>
  )
}
