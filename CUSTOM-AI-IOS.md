# Folo iOS：AI 改用自己的 API

这个分支（`byo-ai`）只改了 AI 摘要和 AI 翻译：开启后它们直接请求你填的 OpenAI 兼容接口，
登录、订阅、抓取、同步等其他功能仍然走官方服务器。

## 改了什么

| 文件                                                                                      | 作用                                              |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `packages/internal/store/src/modules/custom-ai/`                                          | 新增：配置存储和 OpenAI 兼容接口的请求代码        |
| `packages/internal/store/src/modules/summary/store.ts`                                    | 开启自定义 AI 时，摘要请求你的 API                |
| `packages/internal/store/src/modules/translation/store.ts`                                | 开启自定义 AI 时，翻译请求你的 API                |
| `apps/mobile/src/lib/custom-ai.ts`                                                        | 新增：配置保存到 iOS 钥匙串，不同步到 Folo 服务器 |
| `apps/mobile/src/modules/settings/routes/CustomAI.tsx`                                    | 新增：设置 → 自定义 AI 页面                       |
| `apps/mobile/src/atoms/settings/internal/helper.ts`、`EntryContentHeaderRightActions.tsx` | 开启自定义 AI 时，翻译开关不再要求会员            |

## 在 Mac 上编译安装

需要：Xcode（含 iOS SDK）、Node.js 22、CocoaPods、付费 Apple Developer 账号。

```bash
# 1. 准备代码：克隆 byo-ai 分支
#    （不要从 Windows 直接拷 folo 文件夹，里面的 node_modules 是 Windows 版的，在 Mac 上用不了）
git clone -b byo-ai https://github.com/ruivza/Folo.git && cd Folo

# 2. 安装依赖
corepack enable
pnpm install

# 3. 编译文章正文用的网页资源（官方 CI 也是这一步；缺了它 Xcode 会因为找不到 out/rn-web 而编译失败）
pnpm --dir apps/mobile/web-app build --outDir "$(pwd)/out/rn-web/html-renderer"

# 4. 安装 iOS 原生依赖
cd apps/mobile/ios && pod install && cd ..
```

5. 用 Xcode 打开 `apps/mobile/ios/Folo.xcworkspace`，选中 `Folo` target →
   **Signing & Capabilities**：
   - **Team** 选你自己的开发者账号
   - **Bundle Identifier** 改成你自己的，比如 `com.你的名字.folo`（`is.follow` 是官方的，不能用）
   - 保留 Push Notifications 和 Sign in with Apple，Xcode 会自动为你的 Bundle ID 注册

6. 编译安装（二选一）：
   - **直接装到手机**：iPhone 用数据线连 Mac，然后在 `apps/mobile` 目录运行
     `npx expo run:ios --device --configuration Release`
   - **TestFlight**：Xcode → Product → Archive → Distribute App → App Store Connect，
     之后在 TestFlight 里安装（需要先在 App Store Connect 用你的 Bundle ID 建一个 App）

## 使用

打开 App → 设置 → **自定义 AI**：

1. 填 Base URL（可点选 OpenAI、DeepSeek、OpenRouter、硅基流动）、API Key、模型
2. 点 **测试连接**，成功后打开 **使用自己的 API** 开关，再点 **保存**
3. 设置 → 通用 里打开 AI 摘要 / AI 翻译即可

## 已知限制

- **用 Apple 登录不可用**：Bundle ID 变了，Folo 服务器不认这个 App 发出的 Apple 登录凭证。
  用邮箱、Google 或 GitHub 登录；如果你的账号只绑定了 Apple，先在官方 App 的 设置 → 账号 里绑定 Google 或 GitHub。
- **邮箱登录**：改了 Bundle ID 后拿不到 Firebase App Check 令牌，App 会发送备用令牌。
  维护者在 2026-09-26 说明服务器已不再强制检查 App Check（见官方 issue #4132、#3913），所以应该不受影响。
- **不要运行 `npx expo prebuild`**：它会按官方配置重新生成 iOS 工程，覆盖你改的 Bundle ID 和签名设置。
- **推送通知收不到**：官方服务器的推送证书只对 `is.follow` 有效。
- **双语翻译**是让模型在每段原文后插入译文，排版效果取决于模型。
- **跟进官方更新**：拉取官方新代码后重新合并这个分支；冲突一般只会出现在上表这几个文件里。
- OTA 更新在原生工程里本来就是关闭的（`Expo.plist` 的 `EXUpdatesEnabled` 为 false），
  所以官方的热更新不会覆盖这些改动。
