import { useCallback } from "react"
import { useGoogleReCaptcha } from "react-google-recaptcha-v3"

export const useRecaptchaToken = () => {
  const { executeRecaptcha } = useGoogleReCaptcha()

  return useCallback(
    async (action: string) => {
      if (!executeRecaptcha) {
        return null
      }

      try {
        return await executeRecaptcha(action)
      } catch (error) {
        console.error("Failed to execute reCAPTCHA", error)
        return null
      }
    },
    [executeRecaptcha],
  )
}
