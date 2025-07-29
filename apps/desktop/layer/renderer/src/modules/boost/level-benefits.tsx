import { cn } from "@follow/utils/utils"

const benefits = [
  {
    level: 1,
    benefits: [
      {
        icon: "i-mgc-certificate-cute-fi",
        text: "Unique boost badge for feed",
      },
      { icon: "i-mgc-star-cute-re", text: "Support feed owner" },
      { icon: "i-mgc-trophy-cute-re", text: "Booster achievement" },
      { icon: "i-mgc-rocket-cute-re", text: "Faster feed refresh time" },
    ],
  },
  {
    level: 2,
    benefits: [{ icon: "i-mgc-rocket-cute-re", text: "Faster feed refresh time" }],
  },
  {
    level: 3,
    benefits: [
      { icon: "i-mgc-eye-2-cute-re", text: "More developer attention" },
      { icon: "i-mgc-rocket-cute-re", text: "Faster feed refresh time" },
    ],
  },
  {
    level: 4,
    benefits: [
      { icon: "i-mgc-eye-2-cute-re", text: "More developer attention" },
      { icon: "i-mgc-ai-cute-re", text: "AI summary for feed", comingSoon: true },
      { icon: "i-mgc-rocket-cute-re", text: "Faster feed refresh time" },
    ],
  },
]

export const LevelBenefits = () => {
  return (
    <div className="p-4">
      <ul className="space-y-4">
        {benefits.map((benefit) => (
          <BoostLevel key={benefit.level} level={benefit.level} benefits={benefit.benefits} />
        ))}
        <li className="text-center text-gray-500">...</li>
      </ul>
      <div className="mt-8 text-center">
        <h3 className="text-xl font-semibold">More benefits coming soon</h3>
        <p className="text-gray-600">Stay tuned for more exciting benefits and updates!</p>
      </div>
    </div>
  )
}

const BoostLevel = ({
  level,
  benefits,
}: {
  level: number
  benefits: { icon?: string; text: string; comingSoon?: boolean }[]
}) => {
  return (
    <li>
      <div className="flex flex-col">
        <h3 className="text-accent flex items-center gap-2 text-xl font-semibold">
          <span className="grow border-t border-gray-300 dark:border-gray-700" />
          <span>Lv. {level}</span>
          <span className="grow border-t border-gray-300 dark:border-gray-700" />
        </h3>
        <ul className="ml-4 list-inside list-disc space-y-1">
          {benefits.map((benefit) => (
            <li key={benefit.text} className="flex items-center text-sm">
              <i className={cn("mr-2 shrink-0", benefit.icon)} />
              <span className={cn({ "line-through": benefit.comingSoon })}>{benefit.text}</span>
              {benefit.comingSoon && (
                <span className="ml-2 text-xs text-gray-500">(Coming Soon)</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </li>
  )
}
