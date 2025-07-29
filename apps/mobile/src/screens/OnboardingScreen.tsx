import { isNewUserQueryKey, isOnboardingFinishedStorageKey } from "@follow/store/user/constants"
import { tracker } from "@follow/tracker"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { TouchableOpacity, View } from "react-native"
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Text } from "@/src/components/ui/typography/Text"

import { kv } from "../lib/kv"
import { useNavigation } from "../lib/navigation/hooks"
import type { NavigationControllerView } from "../lib/navigation/types"
import { queryClient } from "../lib/query-client"
import { StepFinished } from "../modules/onboarding/step-finished"
import { StepInterests } from "../modules/onboarding/step-interests"
import { StepPreferences } from "../modules/onboarding/step-preferences"
import { StepWelcome } from "../modules/onboarding/step-welcome"

export const OnboardingScreen: NavigationControllerView = () => {
  const { t } = useTranslation("common")
  const insets = useSafeAreaInsets()
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4
  const navigation = useNavigation()
  const handleNext = useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
      tracker.onBoarding({
        step: currentStep,
        done: false,
      })
    } else {
      // Complete onboarding
      tracker.onBoarding({
        step: currentStep,
        done: true,
      })
      kv.set(isOnboardingFinishedStorageKey, "true")
      queryClient
        .invalidateQueries({
          queryKey: isNewUserQueryKey,
        })
        .then(() => {
          navigation.back()
        })
    }
  }, [currentStep, navigation])
  useEffect(() => {
    tracker.onBoarding({
      step: 0,
      done: false,
    })
  }, [])
  return (
    <View
      className="bg-system-grouped-background flex-1 px-6"
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <ProgressIndicator
        currentStep={currentStep}
        totalSteps={totalSteps}
        setCurrentStep={setCurrentStep}
      />

      <Animated.View
        className={"flex-1"}
        key={`step-${currentStep}`}
        exiting={FadeOutLeft}
        entering={FadeInRight}
      >
        {/* Content */}
        {currentStep === 1 && <StepWelcome />}
        {currentStep === 2 && <StepPreferences />}
        {currentStep === 3 && <StepInterests />}
        {currentStep === 4 && <StepFinished />}
      </Animated.View>

      {/* Navigation buttons */}
      <View className="mb-6 px-6">
        <TouchableOpacity
          onPress={handleNext}
          className="bg-accent w-full items-center rounded-xl py-4"
        >
          <Text className="text-lg font-bold text-white">
            {currentStep < totalSteps - 1
              ? t("words.next")
              : currentStep === totalSteps - 1
                ? t("words.finishSetup")
                : t("words.letsGo")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
function ProgressIndicator({
  currentStep,
  totalSteps,
  setCurrentStep,
}: {
  currentStep: number
  totalSteps: number
  setCurrentStep: (step: number) => void
}) {
  return (
    <View className="mb-6 mt-4 flex flex-row justify-center gap-2">
      {Array.from({
        length: totalSteps,
      }).map((_, index) => (
        <TouchableOpacity
          key={`step-${index}-indicator`}
          onPress={() => {
            setCurrentStep(index + 1)
          }}
        >
          <View
            className={`mx-1 h-2 w-10 rounded-full ${currentStep >= index + 1 ? "bg-accent" : "bg-gray-300"}`}
          />
        </TouchableOpacity>
      ))}
    </View>
  )
}
