import { useDark } from "@renderer/hooks/useDark"
import { cn } from "@renderer/lib/utils"
import { useMediaQuery } from "usehooks-ts"

export const Vibrancy: Component<
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>
> = ({ className, children }) => {
  const canVibrancy =
    window.electron && window.electron.process.platform === "darwin"

  const systemDark = useMediaQuery("(prefers-color-scheme: dark)")
  const { isDark } = useDark()
  return (
    <div
      className={cn(
        canVibrancy ? "bg-native/10" : "bg-native",
        systemDark !== isDark && "bg-native",
        className,
      )}
    >
      {children}
    </div>
  )
}
