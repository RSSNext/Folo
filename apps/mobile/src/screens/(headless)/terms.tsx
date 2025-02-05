import { router, Stack, useNavigation } from "expo-router"
import { TouchableOpacity, View } from "react-native"
import { useColor } from "react-native-uikit-colors"

import { Markdown } from "@/src/components/ui/typography/Markdown"
import { MingcuteLeftLineIcon } from "@/src/icons/mingcute_left_line"

const txt = `# Terms of Service

**Effective Date:** 2025-01-17

Welcome to Follow, your personalized RSS reader and content hub. By using our application, you agree to these Terms of Service ("Terms"). Please read them carefully as they govern your use of the Service and the rights and obligations that come with it.

Follow is designed to give you an intuitive, efficient, and user-friendly experience in managing your RSS feeds. We aim to provide a seamless and secure environment, but it’s important for you to understand how your rights are protected and the scope of your responsibilities while using the Service.

## 1. Acceptance of Terms
By accessing or using Follow ("the Service"), you agree to comply with and be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not use the Service. These Terms are a legally binding contract between you and Natural Selection Limited, which owns and operates Follow. By using the Service, you acknowledge that you are responsible for your actions and for ensuring that your usage of Follow is consistent with these Terms.

## 2. Eligibility
You must be at least 13 years old to use Follow. By using the Service, you represent and warrant that you meet this eligibility requirement. If you are under the age of 13, you are prohibited from using the Service. Natural Selection Limited reserves the right to suspend or terminate the access of any user who violates these eligibility requirements. Additionally, if you are using Follow on behalf of a company, you confirm that you have the authority to bind the company to these Terms.

## 3. User Account
To access certain features of the Service, you may be required to create an account. You are responsible for maintaining the confidentiality of your account credentials, such as your username and password, and for all activities that occur under your account. If you suspect any unauthorized access or use of your account, you must notify us immediately to avoid any potential security breaches. You agree to provide accurate, up-to-date information when creating or maintaining your account and understand that failure to do so may result in limitations to your access or functionality of the Service.

## 4. Permitted Use
You agree to use Follow solely for lawful purposes and in a manner that does not violate the rights of others. You shall not use the Service for any unlawful, harmful, or malicious activities. You are prohibited from transmitting harmful content such as malware, viruses, or phishing attempts, and from interfering with the operation or security features of the Service. Unauthorized attempts to gain access to the Service through hacking, password mining, or any other unlawful means are strictly prohibited and may result in immediate termination of your account.

You also agree not to exploit any part of the Service, including features, tools, or content, for commercial purposes unless explicitly authorized by Natural Selection Limited.

## 5. Content and Intellectual Property

### 5.1 User Content
Follow enables you to import, subscribe to, and read content via RSS feeds. You retain full ownership of any content you post, upload, or submit to the Service. By submitting or sharing content, you grant us a worldwide, royalty-free, and non-exclusive license to host, display, modify, and distribute your content as necessary to operate, improve, and provide the Service. You are solely responsible for ensuring that the content you share does not infringe on the intellectual property rights of any third party. You also agree to respect the rights of content creators and copyright holders.

### 5.2 Intellectual Property Rights
The Service and its underlying technology, including software, designs, and content, are owned by Natural Selection Limited or its licensors. You are granted a limited, non-exclusive, non-transferable right to access and use the Service solely for personal, non-commercial purposes. You may not copy, modify, reverse-engineer, distribute, or otherwise exploit any part of the Service without explicit permission from us. All trademarks, logos, and service marks displayed on the Service are the property of Natural Selection Limited or their respective owners. Unauthorized use of any intellectual property displayed on the Service is strictly prohibited.

### 5.3 AI Features and Usage
Follow incorporates AI-powered features that assist in content translation, summarization, intelligent recommendations, and more. While these features are designed to enhance your user experience, you acknowledge that the accuracy and usefulness of AI-generated content may vary. We do not guarantee the correctness, completeness, or reliability of AI outputs and disclaim all responsibility for any adverse effects resulting from their use. Use of these features is entirely at your own risk, and you agree to hold Natural Selection Limited harmless for any errors, misunderstandings, or unintended outcomes arising from the use of AI functionality.

### 5.4 $POWER Economy
Follow introduces the $POWER system, a way for users to support content creators and contributors by tipping or rewarding them with $POWER. You can acquire $POWER by participating in the community, completing designated tasks, or purchasing it through the app. You agree to abide by the rules governing the $POWER system, including: (i) not engaging in fraudulent activities or exploiting the system for illegal or malicious purposes; (ii) acknowledging that $POWER cannot be exchanged for real-world currency or transferred outside of the Service; (iii) accepting that $POWER transactions are final and non-refundable.

Follow reserves the right to modify, suspend, or terminate the $POWER system at any time without prior notice.

## 6. Prohibited Activities
You agree not to engage in any of the following activities while using the Service:
- Engage in any illegal or harmful activities, including distributing malicious software or engaging in data breaches.
- Attempt to gain unauthorized access to any part of the Service or its security features.
- Misuse the $POWER system by gaming the economy or making fraudulent transactions.
- Engage in any behavior that disrupts the normal functionality of the Service or harms other users’ experiences.

Violations of these activities may result in the immediate suspension or termination of your account. In some cases, legal action may be taken if necessary to protect our rights or the rights of others.

## 7. Disclaimer of Warranties
The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We do not make any representations or warranties regarding the availability, functionality, or reliability of the Service. We disclaim all express or implied warranties, including but not limited to warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not guarantee that the Service will be uninterrupted, error-free, or free from security vulnerabilities.

## 8. Limitation of Liability
To the fullest extent permitted by law, Natural Selection Limited shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service, including but not limited to loss of profits, data, or goodwill. In no event shall our liability exceed the total amount you have paid to access the Service during the past 12 months. You agree that your use of the Service is at your own risk.

## 9. Modifications to the Terms
We reserve the right to modify these Terms at any time. Any changes will be effective immediately upon posting on the Service. We will notify you of any significant changes, but it is your responsibility to review the Terms periodically. Your continued use of the Service after any modifications will constitute your acceptance of the updated Terms. If you do not agree to the changes, you must cease using the Service and delete your account.

## 10. Termination
We may suspend, disable, or terminate your access to the Service at any time, for any reason, including but not limited to violations of these Terms, fraudulent behavior, or other actions that disrupt the normal operation of the Service. Upon termination, your account will be deactivated, and you may lose access to your content and any other account-related data. If you wish to terminate your account, you can do so by contacting us or using the account settings feature within the app.

## 11. Governing Law
These Terms are governed by and construed in accordance with the laws of [Insert Jurisdiction]. Any disputes arising out of or in connection with these Terms will be subject to the exclusive jurisdiction of the courts of [Insert Jurisdiction].

## 12. Contact Us
If you have any questions, concerns, or inquiries about these Terms, please contact us at:
- Email: follow@rss3.io

By using Follow, you acknowledge that you have read, understood, and agree to these Terms of Service, as well as our Privacy Policy.

## 13. Community Participation and Contribution
Follow is an open-source project, and we welcome contributions from users and developers. If you are eligible to use Follow, you may participate in the development of the Service by submitting bug reports, feature requests, and improvements. All contributions must adhere to our [code of conduct](https://github.com/RSSNext/Follow/blob/main/CODE_OF_CONDUCT.md).

Before contributing, ensure that you have read and understood our contributing guidelines and the [Corepack](https://nodejs.org/api/corepack.html) setup instructions. By contributing, you agree that your submissions will be licensed under the terms of the [GNU General Public License](https://www.gnu.org/licenses/gpl-3.0.html) version 3.

## 14. Privacy and Data Use
Follow takes your privacy seriously. As a user, you acknowledge that we may collect, store, and process your personal information, including your usage patterns and interactions with content. We are committed to ensuring that your data is handled securely and transparently. Please refer to our [Privacy Policy](#) for more information on how we collect, process, and protect your data.
`

export const TeamsMarkdown = () => {
  return (
    <Markdown
      value={txt}
      webViewProps={{ matchContents: true, scrollEnabled: false }}
      style={{ padding: 16 }}
    />
  )
}

export default function Teams() {
  const canGoBack = useNavigation().canGoBack()
  const label = useColor("label")
  return (
    <View className="flex-1">
      <Stack.Screen
        options={{
          headerBackTitle: "Login",
          headerTitle: "Terms of Service",
          headerShown: true,
          headerLeft: canGoBack
            ? () => (
                <TouchableOpacity hitSlop={10} onPress={() => router.back()}>
                  <MingcuteLeftLineIcon height={20} width={20} color={label} />
                </TouchableOpacity>
              )
            : undefined,
        }}
      />

      <TeamsMarkdown />
    </View>
  )
}
