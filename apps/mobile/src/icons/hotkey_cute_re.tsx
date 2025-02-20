import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface HotkeyCuteReIconProps {
  width?: number
  height?: number
  color?: string
}

export const HotkeyCuteReIcon = ({
  width = 24,
  height = 24,
  color = "#10161F",
}: HotkeyCuteReIconProps) => {
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M17 4a1 1 0 1 0-2 0zM4 15a1 1 0 1 0 0 2zm6-7a1 1 0 0 0-2 0zm-2 4a1 1 0 1 0 2 0zm.445-2.332a1 1 0 0 0 1.11 1.664zm4.11-.336a1 1 0 0 0-1.11-1.664zm-3-.164a1 1 0 1 0-1.11 1.664zm1.89 3.664a1 1 0 0 0 1.11-1.664zm6.848 6.875a1 1 0 0 0 1.414-1.414zm-13.621-.379-.708.707zm14.656 0 .707.707zm0-14.656.707-.708zm-4.207 10.45.707.706zM11.5 4.5h1v-2h-1zm8 7v1h2v-1zm-7 8h-1v2h1zm-8-7v-1h-2v1zM15 4v6h2V4zm-5 11H4v2h6zM8 8v4h2V8zm1.555 3.332 3-2-1.11-1.664-3 2zm-1.11-.5 3 2 1.11-1.664-3-2zm6.348 5.375 3.5 3.5 1.414-1.414-3.5-3.5zM11.5 19.5c-1.914 0-3.249-.002-4.256-.137-.978-.132-1.496-.373-1.865-.742l-1.415 1.415c.803.802 1.814 1.147 3.014 1.309 1.171.157 2.665.155 4.522.155zm-9-7c0 1.857-.002 3.351.155 4.522.162 1.2.507 2.211 1.31 3.014l1.414-1.415c-.37-.369-.61-.887-.741-1.865-.136-1.007-.138-2.342-.138-4.256zm17 0c0 1.914-.002 3.249-.137 4.256-.132.978-.373 1.496-.742 1.865l1.415 1.415c.802-.803 1.147-1.814 1.309-3.014.157-1.171.155-2.665.155-4.522zm-7 9c1.857 0 3.351.002 4.522-.155 1.2-.162 2.211-.507 3.014-1.31l-1.415-1.414c-.369.37-.887.61-1.865.742-1.007.135-2.342.137-4.256.137zm0-17c1.914 0 3.249.002 4.256.138.978.131 1.496.372 1.865.74l1.415-1.414c-.803-.802-1.814-1.147-3.014-1.309-1.171-.157-2.665-.155-4.522-.155zm9 7c0-1.857.002-3.351-.155-4.522-.162-1.2-.507-2.211-1.31-3.014L18.621 5.38c.37.369.61.887.742 1.865.135 1.007.137 2.342.137 4.256zM15 10c0 1.443-.002 2.424-.1 3.159-.096.706-.263 1.033-.486 1.255l1.414 1.414c.657-.656.928-1.475 1.053-2.403.121-.899.119-2.04.119-3.425zm-5 7c1.386 0 2.526.002 3.425-.119.928-.125 1.747-.396 2.403-1.053l-1.414-1.414c-.222.223-.55.39-1.255.485-.735.099-1.716.101-3.159.101zm1.5-14.5c-1.857 0-3.351-.002-4.522.155-1.2.162-2.211.507-3.014 1.31L5.38 5.378c.369-.37.887-.61 1.865-.741C8.251 4.502 9.586 4.5 11.5 4.5zm-7 9c0-1.914.002-3.249.138-4.256.131-.978.372-1.496.74-1.865L3.965 3.964c-.802.803-1.147 1.814-1.309 3.014C2.498 8.149 2.5 9.643 2.5 11.5z"
      />
    </Svg>
  )
}
