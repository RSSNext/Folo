import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface RocketCuteFiIconProps {
  width?: number
  height?: number
  color?: string
}

export const RocketCuteFiIcon = ({
  width = 24,
  height = 24,
  color = "#10161F",
}: RocketCuteFiIconProps) => {
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24">
      <Path
        d="M15.9 2.406c-3.281.283-6.284 1.957-8.724 4.861-.431.513-.599.663-.813.727-.084.025-.404.046-.711.046-.631 0-.994.071-1.43.279a3.155 3.155 0 0 0-.995.796c-.211.268-.769 1.391-.929 1.868-.245.728-.041 1.554.522 2.117.31.31.6.459 1.237.639.284.08.712.208.949.285l.432.139-.176.216c-.389.479-.702 1.151-1.016 2.184-.3.986-.378 1.373-.356 1.77.018.312.04.393.183.683.354.714.974 1.104 1.753 1.104.336 0 1.052-.173 1.969-.476.908-.3 1.494-.595 1.89-.953l.148-.134.142.432c.079.237.207.656.284.931.172.606.298.866.561 1.154.421.463.936.691 1.56.692.463.002.671-.068 1.579-.527.979-.495 1.37-.848 1.702-1.538.201-.418.267-.753.275-1.401.01-.765.039-.818.77-1.406 2.436-1.958 4.011-4.31 4.657-6.953.236-.963.293-1.488.294-2.701.002-1.497-.094-2.154-.415-2.828a3.424 3.424 0 0 0-2.015-1.788c-.644-.216-2.183-.317-3.327-.218m-1.318 5.535c.389.1.659.254.941.536.282.282.436.552.536.941.271 1.057-.447 2.192-1.531 2.418-1.224.255-2.408-.707-2.408-1.956 0-.523.21-1.018.596-1.403.507-.505 1.204-.706 1.866-.536m-6.697 7.488c.3.095.605.401.692.692.084.285.079.472-.019.734-.139.373-.379.54-1.181.824-.282.1-1.427.441-1.48.441-.024 0 .236-.919.39-1.38.292-.87.493-1.162.902-1.308.245-.088.429-.089.696-.003"
        fill={color}
        fillRule="evenodd"
      />
    </Svg>
  )
}
