import { isEqual } from "es-toolkit"
import type { FieldValues, UseFormReturn } from "react-hook-form"
import { useWatch } from "react-hook-form"

// An empty text field, a switch that is off and a value that was never set look the same
const isEmptyFormValue = (value: unknown) =>
  value === undefined || value === null || value === "" || value === false

/**
 * Whether the values differ from the ones the form started with, as the user sees them: typing
 * into an empty field and clearing it again, or turning a switch on and off again, is no change.
 */
export const hasFormValueChanges = (
  values: Record<string, unknown>,
  initialValues: Record<string, unknown> | undefined,
) => {
  const keys = new Set([...Object.keys(values), ...Object.keys(initialValues ?? {})])
  for (const key of keys) {
    const value = values[key]
    const initialValue = initialValues?.[key]
    if (isEmptyFormValue(value) && isEmptyFormValue(initialValue)) continue
    if (!isEqual(value, initialValue)) return true
  }
  return false
}

/** Whether the user changed the form since it was created or last reset. */
export const useFormHasChanges = <T extends FieldValues>(form: UseFormReturn<T>) => {
  const values = useWatch({ control: form.control })
  return hasFormValueChanges(values, form.formState.defaultValues)
}
