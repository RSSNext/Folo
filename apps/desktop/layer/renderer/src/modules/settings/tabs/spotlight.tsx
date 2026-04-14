import { Button } from "@follow/components/ui/button/index.js"
import { Input } from "@follow/components/ui/input/index.js"
import { Label } from "@follow/components/ui/label/index.jsx"
import { SegmentGroup, SegmentItem } from "@follow/components/ui/segment/index.jsx"
import { Switch } from "@follow/components/ui/switch/index.jsx"
import type { SpotlightColorPreset, SpotlightRule } from "@follow/shared/spotlight"
import {
  defaultSpotlightColor,
  getSpotlightColorChoices,
  moveSpotlightRule,
} from "@follow/shared/spotlight"
import { validateSpotlightPattern } from "@follow/utils/spotlight"
import { nanoid } from "nanoid"
import { useTranslation } from "react-i18next"

import { setSpotlightSetting, useSpotlightSettingKey } from "~/atoms/settings/spotlight"

import { SettingDescription } from "../control"

const createSpotlightRule = (): SpotlightRule => ({
  id: nanoid(),
  enabled: true,
  pattern: "",
  patternType: "keyword",
  caseSensitive: false,
  color: defaultSpotlightColor,
})

const updateRuleAtIndex = (
  rules: SpotlightRule[],
  index: number,
  updater: (rule: SpotlightRule) => SpotlightRule,
) => {
  setSpotlightSetting(
    "spotlights",
    rules.map((rule, currentIndex) => (currentIndex === index ? updater(rule) : rule)),
  )
}

const deleteRuleAtIndex = (rules: SpotlightRule[], index: number) => {
  setSpotlightSetting(
    "spotlights",
    rules.filter((_, currentIndex) => currentIndex !== index),
  )
}

export const SettingSpotlight = () => {
  const { t } = useTranslation("settings")
  const rules = useSpotlightSettingKey("spotlights")

  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            setSpotlightSetting("spotlights", [...rules, createSpotlightRule()])
          }}
        >
          {t("spotlight.add_rule")}
        </Button>
      </div>

      {rules.map((rule, index) => (
        <SpotlightRuleEditor
          key={rule.id}
          isFirst={index === 0}
          isLast={index === rules.length - 1}
          rule={rule}
          onUpdate={(updater) => {
            updateRuleAtIndex(rules, index, updater)
          }}
          onMove={(direction) => {
            setSpotlightSetting("spotlights", moveSpotlightRule(rules, index, direction))
          }}
          onDelete={() => {
            deleteRuleAtIndex(rules, index)
          }}
        />
      ))}
    </div>
  )
}

const SpotlightRuleEditor = ({
  rule,
  isFirst,
  isLast,
  onUpdate,
  onMove,
  onDelete,
}: {
  rule: SpotlightRule
  isFirst: boolean
  isLast: boolean
  onUpdate: (updater: (rule: SpotlightRule) => SpotlightRule) => void
  onMove: (direction: -1 | 1) => void
  onDelete: () => void
}) => {
  const { t } = useTranslation("settings")
  const validation = validateSpotlightPattern(rule.pattern, rule.patternType)
  const showRegexError = rule.patternType === "regex" && !validation.valid
  const colorChoices = getSpotlightColorChoices(rule.color)

  const patternInputId = `spotlight-pattern-${rule.id}`
  const enabledInputId = `spotlight-enabled-${rule.id}`
  const caseSensitiveInputId = `spotlight-case-sensitive-${rule.id}`

  return (
    <div className="space-y-4 rounded-xl border border-fill-secondary bg-material-ultra-thin p-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium" htmlFor={patternInputId}>
          {t("spotlight.pattern")}
        </Label>
        <Input
          id={patternInputId}
          value={rule.pattern}
          onChange={(event) => {
            const pattern = event.target.value
            onUpdate((currentRule) => ({ ...currentRule, pattern }))
          }}
        />
        {showRegexError && (
          <SettingDescription className="w-full text-red">
            {t("spotlight.invalid_regex", { error: validation.error })}
          </SettingDescription>
        )}
      </div>

      <div className="space-y-2">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t("spotlight.type")}</Label>
          <SegmentGroup
            className="h-9"
            value={rule.patternType}
            onValueChanged={(value) => {
              if (value !== "keyword" && value !== "regex") return
              onUpdate((currentRule) => ({ ...currentRule, patternType: value }))
            }}
          >
            <SegmentItem value="keyword" label={t("spotlight.keyword")} />
            <SegmentItem value="regex" label={t("spotlight.regex")} />
          </SegmentGroup>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">{t("spotlight.color")}</Label>
        <div className="flex flex-wrap gap-3">
          {colorChoices.map((preset) => (
            <SpotlightColorButton
              key={preset.value}
              preset={preset}
              selected={preset.value.toUpperCase() === rule.color.toUpperCase()}
              onClick={() => {
                onUpdate((currentRule) => ({ ...currentRule, color: preset.value }))
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Label className="text-sm font-medium" htmlFor={enabledInputId}>
          {t("spotlight.enabled")}
        </Label>
        <Switch
          id={enabledInputId}
          checked={rule.enabled}
          onCheckedChange={(enabled) => {
            onUpdate((currentRule) => ({ ...currentRule, enabled }))
          }}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <Label className="text-sm font-medium" htmlFor={caseSensitiveInputId}>
          {t("spotlight.case_sensitive")}
        </Label>
        <Switch
          id={caseSensitiveInputId}
          checked={rule.caseSensitive}
          onCheckedChange={(caseSensitive) => {
            onUpdate((currentRule) => ({ ...currentRule, caseSensitive }))
          }}
        />
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onDelete}>
          {t("words.delete", { ns: "common" })}
        </Button>
        <Button disabled={isFirst} size="sm" variant="outline" onClick={() => onMove(-1)}>
          {t("spotlight.move_up")}
        </Button>
        <Button disabled={isLast} size="sm" variant="outline" onClick={() => onMove(1)}>
          {t("spotlight.move_down")}
        </Button>
      </div>
    </div>
  )
}

const SpotlightColorButton = ({
  preset,
  selected,
  onClick,
}: {
  preset: SpotlightColorPreset
  selected: boolean
  onClick: () => void
}) => {
  return (
    <button
      type="button"
      data-spotlight-color-option={preset.value}
      aria-label={`Select highlight color ${preset.value}`}
      className="relative size-9 rounded-full border border-fill-secondary shadow-sm transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2"
      style={{
        backgroundColor: preset.value,
        boxShadow: selected ? "0 0 0 2px hsl(var(--fo-a) / 0.8)" : undefined,
      }}
      onClick={onClick}
    >
      {selected && (
        <span className="center absolute -bottom-1 -right-1 size-5 rounded-full bg-blue text-white shadow-sm">
          <i className="i-mgc-check-cute-re text-xs" />
        </span>
      )}
    </button>
  )
}
