import { cn } from "@follow/utils/utils"
import { OTPInput, OTPInputContext } from "input-otp"
import * as React from "react"

const InputOTP = ({
  ref,
  className,
  containerClassName,
  ...props
}: React.ComponentPropsWithoutRef<typeof OTPInput> & {
  ref?: React.Ref<React.ElementRef<typeof OTPInput> | null>
}) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      containerClassName,
    )}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
)
InputOTP.displayName = "InputOTP"

const InputOTPGroup = ({
  ref,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<React.ElementRef<"div"> | null>
}) => <div ref={ref} className={cn("flex items-center", className)} {...props} />
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = ({
  ref,
  index,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { index: number } & {
  ref?: React.Ref<React.ElementRef<"div"> | null>
}) => {
  const inputOTPContext = React.use(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]!

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex size-9 items-center justify-center border-y border-r border-border font-mono text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 ring-1 ring-accent",
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="bg-foreground h-4 w-px animate-caret-blink duration-1000" />
        </div>
      )}
    </div>
  )
}
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = ({
  ref,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<React.ElementRef<"div"> | null>
}) => (
  <div
    ref={ref}
    className={cn("flex w-10 items-center justify-center", className)}
    role="separator"
    {...props}
  >
    <div className="h-1 w-3 rounded-full bg-border" />
  </div>
)
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot }
