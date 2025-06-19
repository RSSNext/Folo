import { Button } from "@follow/components/ui/button/index.js"
import { Checkbox } from "@follow/components/ui/checkbox/index.jsx"
import { Input } from "@follow/components/ui/input/index.js"
import { Label } from "@follow/components/ui/label/index.jsx"
import { SegmentGroup, SegmentItem } from "@follow/components/ui/segment/index.jsx"
import { Switch } from "@follow/components/ui/switch/index.jsx"
import { cn } from "@follow/utils/utils"
import type { ChangeEventHandler, ReactNode } from "react"
import { useId, useState } from "react"
import { titleCase } from "title-case"

export const SettingCheckbox: Component<{
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}> = ({ checked, label, onCheckedChange }) => {
  const id = useId()
  return (
    <div className="mb-2 flex items-center gap-4">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="cursor-auto"
      />
      <Label htmlFor={id}>{titleCase(label)}</Label>
    </div>
  )
}

export const SettingSwitch: Component<{
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}> = ({ checked, label, onCheckedChange, className }) => {
  const id = useId()
  const handleCheckedChange = (checked: boolean) => {
    onCheckedChange(checked)
  }
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-4", className)}>
      <Label htmlFor={id}>{titleCase(label)}</Label>
      <Switch id={id} checked={checked} onCheckedChange={handleCheckedChange} />
    </div>
  )
}

export const SettingInput: Component<{
  label: string
  value: string
  onChange: ChangeEventHandler<HTMLInputElement>
  type: string
  vertical?: boolean
  labelClassName?: string
}> = ({ value, label, onChange, labelClassName, className, type, vertical }) => {
  const id = useId()

  return (
    <div
      className={cn(
        "mb-1 flex",
        vertical ? "mb-2 flex-col gap-3" : "flex-row items-center justify-between gap-12",
        className,
      )}
    >
      <Label className={cn("shrink-0", labelClassName)} htmlFor={id}>
        {titleCase(label)}
      </Label>
      <Input type={type} id={id} value={value} onChange={onChange} className="text-xs" />
    </div>
  )
}

export const SettingTabbedSegment: Component<{
  label: ReactNode
  value: string
  onValueChanged?: (value: string) => void
  values: { value: string; label: string; icon?: ReactNode }[]
  description?: string
}> = ({ label, className, value, values, onValueChanged, description }) => {
  const [currentValue, setCurrentValue] = useState(value)

  return (
    <>
      <div className={cn("mb-3 flex items-center justify-between gap-4", className)}>
        <label className="text-sm font-medium leading-none">
          {typeof label === "string" ? titleCase(label) : label}
        </label>

        <SegmentGroup
          className="h-8"
          value={currentValue}
          onValueChanged={(v) => {
            setCurrentValue(v)
            onValueChanged?.(v)
          }}
        >
          {values.map((v) => (
            <SegmentItem
              key={v.value}
              value={v.value}
              label={
                <div className="flex items-center gap-1">
                  {v.icon}
                  <span>{v.label}</span>
                </div>
              }
            />
          ))}
        </SegmentGroup>
      </div>
      {description && <SettingDescription className="-mt-3">{description}</SettingDescription>}
    </>
  )
}

export const SettingDescription: Component = ({ children, className }) => (
  <small className={cn("text-text-secondary text-body block w-4/5 leading-snug", className)}>
    {children}
  </small>
)

export const SettingActionItem = ({
  label,
  action,
  buttonText,
}: {
  label: ReactNode
  action: () => void
  buttonText: string
}) => (
  <div className={cn("relative mb-3 mt-4 flex items-center justify-between gap-4")}>
    <div className="text-sm font-medium">
      {typeof label === "string" ? titleCase(label) : label}
    </div>
    <Button variant="outline" size="sm" onClick={action}>
      {buttonText}
    </Button>
  </div>
)
