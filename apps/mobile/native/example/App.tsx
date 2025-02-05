import { SharedWebView } from "follow-native"
import { ScrollView, View } from "react-native"

export default function App() {
  return (
    <ScrollView>
      <SharedWebView url="https://innei.in" />

      <View style={{ height: 1000, backgroundColor: "red" }} />
    </ScrollView>
  )
}
