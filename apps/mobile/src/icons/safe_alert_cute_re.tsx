import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface SafeAlertCuteReIconProps {
  width?: number
  height?: number
  color?: string
}

export const SafeAlertCuteReIcon = ({
  width = 24,
  height = 24,
  color = "#10161F",
}: SafeAlertCuteReIconProps) => {
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24">
      <Path
        d="M11.64 2.226c-.659.099-.893.176-3.351 1.099-2.373.892-2.719 1.028-3.101 1.221-.822.414-1.378.976-1.774 1.794C3.042 7.111 3 7.535 3 10.516c.001 2.311.031 2.861.199 3.669.463 2.229 1.789 4.214 3.701 5.544.5.347 2.718 1.591 2.732 1.532.009-.039.081-.029.3.04 1.313.417 3.032.392 4.332-.064.933-.327 2.579-1.266 3.456-1.972 1.563-1.259 2.721-3.202 3.099-5.202.157-.827.181-1.304.181-3.587 0-2.938-.043-3.367-.414-4.136-.492-1.017-1.147-1.574-2.474-2.104-.922-.367-4.676-1.758-4.996-1.851-.534-.154-1.102-.215-1.476-.159m1.04 2.116c.364.115 4.051 1.494 4.798 1.794.247.099.536.236.642.304.371.238.651.616.787 1.06.068.222.073.437.073 2.9 0 2.966-.004 3.019-.286 3.96-.174.581-.643 1.535-1.003 2.038-.337.472-1.037 1.182-1.509 1.533-.383.285-1.564.974-2.066 1.205A4.75 4.75 0 0 1 12 19.6a4.75 4.75 0 0 1-2.116-.464c-.502-.231-1.683-.92-2.066-1.205-.472-.351-1.172-1.061-1.509-1.533-.36-.503-.829-1.457-1.003-2.038-.282-.941-.286-.994-.286-3.96 0-2.463.005-2.678.073-2.9.136-.444.416-.822.787-1.06.237-.152.598-.298 2.78-1.12 2.917-1.1 3.012-1.131 3.42-1.103.143.009.413.066.6.125m-1.007 2.721c-.261.08-.533.358-.612.627-.093.313-.091 4.369.003 4.644.124.363.549.666.936.666.237 0 .514-.12.697-.303.305-.306.303-.286.303-2.697s.002-2.391-.303-2.697c-.279-.279-.63-.361-1.024-.24m0 7c-.369.114-.673.546-.673.957 0 .395.319.811.709.924a.987.987 0 0 0 1.278-1.056.977.977 0 0 0-.665-.827c-.21-.074-.402-.074-.649.002"
        fill={color}
        fillRule="evenodd"
      />
    </Svg>
  )
}
