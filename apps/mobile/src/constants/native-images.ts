import { BlackBoard2CuteFiIcon } from "../icons/black_board_2_cute_fi"
import { BlackBoard2CuteReIcon } from "../icons/black_board_2_cute_re"
import { Home5CuteFiIcon } from "../icons/home_5_cute_fi"
import { Home5CuteReIcon } from "../icons/home_5_cute_re"
import { Search3CuteFiIcon } from "../icons/search_3_cute_fi"
import { Search3CuteReIcon } from "../icons/search_3_cute_re"
import { Settings1CuteFiIcon } from "../icons/settings_1_cute_fi"
import { Settings1CuteReIcon } from "../icons/settings_1_cute_re"

export const IconNodeMap = {
  home5CuteRe: Home5CuteReIcon,
  home5CuteFi: Home5CuteFiIcon,
  settings1CuteRe: Settings1CuteReIcon,
  settings1CuteFi: Settings1CuteFiIcon,
  blackBoard2CuteRe: BlackBoard2CuteReIcon,
  blackBoard2CuteFi: BlackBoard2CuteFiIcon,
  search3CuteRe: Search3CuteReIcon,
  search3CuteFi: Search3CuteFiIcon,
} as const

export const IconNativeNameMap = {
  home5CuteRe: "home_5_cute_re",
  home5CuteFi: "home_5_cute_fi",
  settings1CuteRe: "settings_1_cute_re",
  settings1CuteFi: "settings_1_cute_fi",
  blackBoard2CuteRe: "black_board_2_cute_re",
  blackBoard2CuteFi: "black_board_2_cute_fi",
  search3CuteRe: "search_3_cute_re",
  search3CuteFi: "search_3_cute_fi",
} as const

export type IconNativeName = keyof typeof IconNativeNameMap

export type IconNativeValues = (typeof IconNativeNameMap)[keyof typeof IconNativeNameMap]
