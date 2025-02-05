import { Stack } from "expo-router"

export default function ModalLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="add"
        options={{
          title: "Add Subscription",
        }}
      />
      <Stack.Screen
        name="rsshub-form"
        options={{
          title: "RSSHub Form",
        }}
      />
      <Stack.Screen
        name="follow"
        options={{
          title: "Follow",
        }}
      />
      <Stack.Screen
        name="list"
        options={{
          title: "List",
        }}
      />
    </Stack>
  )
}
