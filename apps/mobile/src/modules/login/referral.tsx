import { useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import { View } from "react-native"

import { PlainTextField } from "@/src/components/ui/form/TextField"
import { JotaiPersistSyncStorage } from "@/src/lib/jotai"
import { accentColor } from "@/src/theme/colors"

const referralCodeAtom = atomWithStorage("referral-code", "", JotaiPersistSyncStorage, {
  getOnInit: true,
})

export function ReferralForm() {
  const [referralCode, setReferralCode] = useAtom(referralCodeAtom)

  return (
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
        placeholder="Referral Code (optional)"
        className="text-text flex-1"
      />
    </View>
  )
}
