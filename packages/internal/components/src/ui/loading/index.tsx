import { cn } from "@follow/utils/utils"
import { m, useAnimation } from "motion/react"
import * as React from "react"
import { cloneElement, useEffect } from "react"

interface LoadingCircleProps {
  size: "small" | "medium" | "large"
}

const sizeMap = {
  small: 16,
  medium: 24,
  large: 30,
}
export const LoadingCircle: Component<LoadingCircleProps> = ({ className, size }) => (
  <div
    className={className}
    style={{
      fontSize: sizeMap[size],
    }}
  >
    <i className="i-mgc-loading-3-cute-re animate-spin" />
  </div>
)

const sizeMap2 = {
  small: 30,
  medium: 40,
  large: 50,
}

const smallIconSizeMap = {
  small: 16,
  medium: 18,
  large: 24,
}
export const LoadingWithIcon: Component<
  LoadingCircleProps & {
    icon: React.JSX.Element
    order?: "loading-first" | "icon-first"
  }
> = ({ order = "loading-first", size, className, icon, children }) => {
  const rootStyle = { width: sizeMap2[size], height: sizeMap2[size] }

  const smallIconStyle = {
    height: smallIconSizeMap[size],
    width: smallIconSizeMap[size],
  }

  const Children = children && <div className="center flex">{children}</div>
  if (order === "icon-first") {
    return (
      <div className={className}>
        <div style={rootStyle} className="relative inline-block">
          <span className="block size-full">
            {cloneElement(icon, {
              style: {
                ...icon.props.style,
                fontSize: sizeMap2[size],
              },
              className: cn(icon.props.className),
            })}
          </span>
          <span
            className="absolute bottom-1"
            style={{
              ...smallIconStyle,
              right: -smallIconSizeMap[size] + 4,
            }}
          >
            <i
              className="i-mgc-loading-3-cute-re animate-spin"
              style={{ fontSize: smallIconSizeMap[size] }}
            />
          </span>
        </div>

        {Children}
      </div>
    )
  } else {
    return (
      <div className={className}>
        <div style={rootStyle} className="relative inline-block">
          <span
            className="block size-full"
            style={{
              clipPath: `polygon(0% 0%, 0% 100%, calc(100% - ${smallIconSizeMap[size]}px) 100%, ${smallIconSizeMap[size]}px ${smallIconSizeMap[size]}px, 100% calc(100% - ${smallIconSizeMap[size]}px), 100% 100%, 100% 100%, 100% 0%)`,
            }}
          >
            <i
              className="i-mgc-loading-3-cute-li animate-spin"
              style={{ fontSize: sizeMap2[size] }}
            />
          </span>
          <span
            className={cn("absolute bottom-0 right-0", "animate-pulse duration-700")}
            style={smallIconStyle}
          >
            {cloneElement(icon, {
              style: {
                ...icon.props.style,
                fontSize: smallIconSizeMap[size],
                width: smallIconSizeMap[size],
                height: smallIconSizeMap[size],
              },
              className: icon.props.className,
            })}
          </span>
        </div>
        {Children}
      </div>
    )
  }
}

export const RotatingRefreshIcon: React.FC<{
  isRefreshing: boolean
  className?: string
}> = ({ isRefreshing, className }) => {
  const controls = useAnimation()

  useEffect(() => {
    if (isRefreshing) {
      controls.set({ transform: `rotate(0deg)` })
      controls.start({
        transform: `rotate(360deg)`,
        transition: { duration: 1, repeat: Infinity, ease: "linear" },
      })
    } else {
      controls.start({
        transform: `rotate(0deg)`,
        transition: { type: "spring" },
      })
    }
  }, [isRefreshing, controls])

  return <m.i className={cn("i-mgc-refresh-2-cute-re", className)} animate={controls} />
}
