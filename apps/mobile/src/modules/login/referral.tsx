import { cn } from "@follow/utils"
import { useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import { View } from "react-native"

import { PlainTextField } from "@/src/components/ui/form/TextField"
import { JotaiPersistSyncStorage } from "@/src/lib/jotai"
import { accentColor } from "@/src/theme/colors"

const referralCodeAtom = atomWithStorage("referral-code", "", JotaiPersistSyncStorage, {
  getOnInit: true,
})

export function ReferralForm({ className }: { className?: string }) {
  const [referralCode, setReferralCode] = useAtom(referralCodeAtom)

  return (
    <View className={cn("mx-auto mt-4 w-full", className)}>
      <View className="bg-secondary-system-background gap-4 rounded-2xl px-6 py-4">
        <View className="flex-row">
          <PlainTextField
            value={referralCode}
            onChangeText={(text) => {
              setReferralCode(text)
            }}
            selectionColor={accentColor}
            hitSlop={20}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Referral Code"
            className="text-text flex-1"
          />
        </View>
      </View>
    </View>
  )
}
