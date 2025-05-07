import { CheckCircleFilledIcon } from "@/src/icons/check_circle_filled"
import { CloseCircleFillIcon } from "@/src/icons/close_circle_fill"
import { InfoCircleFillIcon } from "@/src/icons/info_circle_fill"

export const toastTypeToIcons = {
  success: CheckCircleFilledIcon,
  error: CloseCircleFillIcon,
  info: InfoCircleFillIcon,
} as const
