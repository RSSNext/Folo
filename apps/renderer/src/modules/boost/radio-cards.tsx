import { RadioCard } from "@follow/components/ui/radio-group/RadioCard.js"
import { RadioGroup } from "@follow/components/ui/radio-group/RadioGroup.js"
import dayjs from "dayjs"
import { m } from "framer-motion"

import { softSpringPreset } from "~/components/ui/constants/spring"

const radios = [
  {
    value: 1,
  },
  {
    value: 3,
  },
  {
    value: 6,
  },
  {
    value: 12,
  },
]

export const RadioCards = ({
  monthlyBoostCost,
  value,
  onValueChange,
}: {
  monthlyBoostCost: number
  value: number
  onValueChange: (value: number) => void
}) => {
  return (
    <RadioGroup value={value.toString()} onValueChange={(value) => onValueChange(+value)}>
      <m.div
        className="grid w-full grid-cols-2 gap-2"
        initial={{ height: "auto", opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={softSpringPreset}
      >
        {radios.map((item) => (
          <RadioCard
            key={item.value}
            wrapperClassName="justify-center py-2.5"
            value={(item.value * monthlyBoostCost).toString()}
            label={
              <div className="text-center">
                <h3 className="text-sm font-medium leading-none">
                  {dayjs.duration(item.value, "months").humanize()}
                </h3>
                <p className="mt-1 flex items-center justify-center gap-1 text-xs leading-none text-theme-vibrancyFg">
                  {item.value * monthlyBoostCost}
                  <i className="i-mgc-power text-accent" />
                </p>
              </div>
            }
          />
        ))}
      </m.div>
    </RadioGroup>
  )
}
