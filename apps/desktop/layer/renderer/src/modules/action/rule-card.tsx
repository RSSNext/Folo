import { Input } from "@follow/components/ui/input/index.js"
import { Switch } from "@follow/components/ui/switch/index.jsx"
import { useActionRule } from "@follow/store/action/hooks"
import { actionActions } from "@follow/store/action/store"

import { ThenSection } from "./then-section"
import { WhenSection } from "./when-section"

export const RuleCard = ({ index }: { index: number }) => {
  return (
    <div className="bg-material-ultra-thin group/card-root relative flex flex-col gap-4 rounded-2xl border p-4 shadow-sm md:p-6">
      <RuleCardToolbar index={index} />
      <div className="@[800px]:grid-cols-2 grid grid-cols-1 gap-x-8 gap-y-6">
        <WhenSection index={index} />
        <ThenSection index={index} />
      </div>
    </div>
  )
}

const RuleCardToolbar = ({ index }: { index: number }) => {
  const name = useActionRule(index, (a) => a.name)
  const disabled = useActionRule(index, (a) => a.result.disabled)

  return (
    <div className="flex w-full items-center gap-3">
      <Input
        value={name}
        className="h-9 max-w-64 bg-transparent px-2 text-lg font-semibold shadow-none ring-0 focus-visible:ring-0"
        onChange={(e) => {
          actionActions.patchRule(index, { name: e.target.value })
        }}
      />
      <div className="grow" />

      <Switch
        checked={!disabled}
        onCheckedChange={(checked) => {
          actionActions.patchRule(index, {
            result: { disabled: !checked },
          })
        }}
      />
      <div className="absolute right-0 top-0 opacity-0 transition-opacity duration-200 group-hover/card-root:opacity-100">
        <button
          className="bg-background center flex size-8 -translate-y-1/2 translate-x-1/2 rounded-full border"
          type="button"
          onClick={() => {
            actionActions.deleteRule(index)
          }}
        >
          <i className="i-mgc-close-cute-re" />
        </button>
      </div>
    </div>
  )
}
