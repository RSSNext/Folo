import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface Translate2AiCuteReIconProps {
  width?: number
  height?: number
  color?: string
}

export const Translate2AiCuteReIcon = ({
  width = 24,
  height = 24,
  color = "#10161F",
}: Translate2AiCuteReIconProps) => {
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24">
      <Path
        d="M18.726 1.046c-.191.055-.423.21-.521.347a3.981 3.981 0 0 0-.258.58c-.219.581-.377.844-.714 1.19a2.854 2.854 0 0 1-1.087.718l-.501.191c-.548.212-.786.857-.515 1.399.13.26.308.385.812.57.573.21.88.392 1.222.726.336.328.555.659.717 1.087l.191.501c.154.396.608.68 1.014.632.258-.031.535-.171.677-.343.062-.076.187-.34.278-.586.21-.573.392-.88.726-1.222a2.86 2.86 0 0 1 1.087-.717l.501-.191c.548-.212.786-.857.515-1.399-.13-.26-.308-.385-.812-.57-.573-.21-.88-.392-1.222-.726a2.86 2.86 0 0 1-.717-1.087l-.191-.501a1.018 1.018 0 0 0-1.202-.599M8.673 3.063c-.244.075-.523.351-.609.603-.047.138-.064.341-.064.761V5H5.947c-2.349 0-2.34-.001-2.641.3a.96.96 0 0 0 0 1.4c.314.314.127.3 4.101.3 3.22 0 3.513.005 3.513.065 0 .149-.218 1.021-.348 1.394-.285.818-.892 1.927-1.409 2.575l-.171.213-.257-.349A9.527 9.527 0 0 1 7.579 8.86c-.186-.442-.317-.615-.553-.733-.552-.275-1.21-.025-1.4.533-.097.284-.082.462.07.852.387.992.953 1.976 1.637 2.842l.263.334-.172.148c-.863.747-2.316 1.621-3.528 2.122-.475.196-.642.323-.773.585a.989.989 0 0 0 .82 1.449c.252.021.632-.121 1.637-.613 1.194-.583 2.298-1.298 3.168-2.051l.248-.214.272.231a17.26 17.26 0 0 0 1.627 1.188c.217.135.402.265.411.288.009.024-.049.222-.129.441-.48 1.319-1.129 3.357-1.164 3.658a.972.972 0 0 0 .285.78.987.987 0 0 0 1.404.001c.158-.159.19-.228.359-.768.102-.326.284-.895.406-1.263l.22-.67h5.626l.22.67c.122.368.304.937.406 1.263.169.54.201.609.359.768a.988.988 0 0 0 1.042.233c.412-.141.704-.612.645-1.042-.053-.387-.884-2.912-1.413-4.292-.731-1.907-1.718-4.047-2.406-5.215-.373-.632-.969-.985-1.666-.985-.701 0-1.291.351-1.673.996-.285.48-1.005 1.917-1.385 2.764a26.31 26.31 0 0 1-.346.756c-.05.056-1.688-1.164-1.666-1.242.006-.02.118-.171.249-.337 1.136-1.429 1.994-3.352 2.206-4.947.047-.353.06-.39.136-.39.047 0 .177-.027.289-.061.378-.112.69-.537.69-.939 0-.237-.12-.514-.303-.697C13.401 5.007 13.35 5 11.553 5H10v-.553c0-.696-.052-.893-.303-1.144-.279-.279-.63-.361-1.024-.24m10.715 1.54.403.404-.182.166c-.224.206-.23.212-.436.436l-.166.182-.396-.396L18.215 5l.383-.394c.21-.216.383-.396.384-.4.001-.003.184.175.406.397m-3.371 7.876c.605 1.197 1.543 3.319 1.543 3.491 0 .017-.918.03-2.04.03-1.122 0-2.04-.006-2.04-.012 0-.007.036-.087.08-.179a.803.803 0 0 0 .08-.269c0-.244 1.112-2.699 1.711-3.775.131-.236.146-.25.197-.181.03.041.241.444.469.895"
        fill={color}
        fillRule="evenodd"
      />
    </Svg>
  )
}
