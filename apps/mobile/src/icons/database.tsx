import type { SvgProps } from "react-native-svg"
import Svg, { Path } from "react-native-svg"

export function DatabaseIcon(
  props: SvgProps & {
    width?: number
    height?: number
    color?: string
  },
) {
  return (
    <Svg width={props.width} height={props.height} viewBox="0 0 24 24" {...props}>
      <Path
        fill={props.color}
        d="M12 11q-3.75 0-6.375-1.175T3 7q0-1.65 2.625-2.825Q8.25 3 12 3t6.375 1.175Q21 5.35 21 7q0 1.65-2.625 2.825Q15.75 11 12 11Zm0 5q-3.75 0-6.375-1.175T3 12V9.5q0 1.1 1.025 1.863q1.025.762 2.45 1.237q1.425.475 2.963.687q1.537.213 2.562.213t2.562-.213q1.538-.212 2.963-.687q1.425-.475 2.45-1.237Q21 10.6 21 9.5V12q0 1.65-2.625 2.825Q15.75 16 12 16Zm0 5q-3.75 0-6.375-1.175T3 17v-2.5q0 1.1 1.025 1.863q1.025.762 2.45 1.237q1.425.475 2.963.688q1.537.212 2.562.212t2.562-.212q1.538-.213 2.963-.688t2.45-1.237Q21 15.6 21 14.5V17q0 1.65-2.625 2.825Q15.75 21 12 21Z"
      />
    </Svg>
  )
}
