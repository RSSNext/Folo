import { tracker } from "@follow/tracker"
import { useCallback, useEffect, useState } from "react"
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native"
import { SheetScreen } from "react-native-sheet-transitions"

import { kv } from "../lib/kv"
import { useNavigation } from "../lib/navigation/hooks"
import type { NavigationControllerView } from "../lib/navigation/types"
import { queryClient } from "../lib/query-client"
import { StepFinished } from "../modules/onboarding/step-finished"
import { StepInterests } from "../modules/onboarding/step-interests"
import { StepPreferences } from "../modules/onboarding/step-preferences"
import { StepWelcome } from "../modules/onboarding/step-welcome"
import { isNewUserQueryKey, isOnboardingFinishedStorageKey } from "../store/user/constants"

export const OnboardingScreen: NavigationControllerView = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4

  const navigation = useNavigation()
  const handleNext = useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
      tracker.onBoarding({ step: currentStep, done: false })
    } else {
      // Complete onboarding
      tracker.onBoarding({ step: currentStep, done: true })
      kv.set(isOnboardingFinishedStorageKey, "true")
      queryClient.invalidateQueries({ queryKey: isNewUserQueryKey }).then(() => {
        navigation.back()
      })
    }
  }, [currentStep, navigation])
  useEffect(() => {
    tracker.onBoarding({ step: 0, done: false })
  }, [])

  return (
    <SheetScreen onClose={() => navigation.dismiss()}>
      <View className="bg-system-grouped-background flex-1 px-6">
        <SafeAreaView className="flex-1">
          <ProgressIndicator
            currentStep={currentStep}
            totalSteps={totalSteps}
            setCurrentStep={setCurrentStep}
          />

          {/* Content */}
          {currentStep === 1 && <StepWelcome />}
          {currentStep === 2 && <StepPreferences />}
          {currentStep === 3 && <StepInterests />}
          {currentStep === 4 && <StepFinished />}

          {/* Navigation buttons */}
          <View className="mb-6 px-6">
            <TouchableOpacity
              onPress={handleNext}
              className="bg-accent w-full items-center rounded-xl py-4"
            >
              <Text className="text-lg font-bold text-white">
                {currentStep < totalSteps - 1
                  ? "Next"
                  : currentStep === totalSteps - 1
                    ? "Finish Setup"
                    : "Let's Go!"}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </SheetScreen>
  )
}

OnboardingScreen.transparent = true
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
      {Array.from({ length: totalSteps }).map((_, index) => (
        <TouchableOpacity
          key={`step-${index}-indicator`}
          onPress={() => {
            setCurrentStep(index + 1)
          }}
        >
          <View
            className={`mx-1 h-2 w-10 rounded-full ${
              currentStep >= index + 1 ? "bg-accent" : "bg-gray-300"
            }`}
          />
        </TouchableOpacity>
      ))}
    </View>
  )
}
