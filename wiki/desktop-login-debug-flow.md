# Desktop Login Debug Flow

这份文档记录了本次在 macOS 上调通 Folo 正式包登录与 `dev:electron` 复用登录态的关键流程，目的是方便后续重复操作，不再走弯路。

## 结论先说

- 本地可运行的正式 `.app` 可以直接通过 `electron-forge package` 生成，不一定要等 `make` 出 DMG。
- 这次真正跑通的链路是：
  1. 打一个新的正式 `.app`
  2. 放到 `/Applications/Folo.app`
  3. 用这个正式包完成一次真实登录
  4. 然后直接启动 `pnpm run dev:electron`
- 这次成功登录后，会话实际落在了 `~/Library/Application Support/Folo(dev)`，而不是 `~/Library/Application Support/Folo`
- `dev:electron` 最终已验证登录成功，主进程日志返回 `API Response: 200 OK`

## 适用场景

- 需要先让桌面端登录成功，再继续调试 Electron 开发版
- 需要绕开不稳定的 one-time token 手动输入调试
- 需要确认正式包能跑、能登录、开发版也能继承会话

## 关键目录

### 正式包

```text
/Applications/Folo.app
```

### 正式包本地打包产物

```text
apps/desktop/out/Folo-darwin-arm64/Folo.app
```

### 正式包默认用户数据目录

```text
~/Library/Application Support/Folo
```

### Electron 开发版用户数据目录

```text
~/Library/Application Support/Folo(dev)
```

## 推荐流程

### 1. 打一个新的正式 `.app`

在桌面端目录执行：

```bash
cd apps/desktop
CI=1 pnpm exec electron-forge package --platform=darwin --arch=arm64
```

说明：

- 这个命令只产出 `.app`
- 不走 `electron-forge make`
- 可以避开 DMG / ZIP 阶段可能出现的长时间卡住问题

### 2. 用新产物替换 `/Applications/Folo.app`

建议保留旧包备份，再覆盖：

```bash
NEW_APP="/absolute/path/to/apps/desktop/out/Folo-darwin-arm64/Folo.app"
APP_DST="/Applications/Folo.app"
STAMP=$(date +%Y%m%d-%H%M%S)

if [ -d "$APP_DST" ]; then
  mv "$APP_DST" "/Applications/Folo.app.bak-$STAMP"
fi

/usr/bin/ditto "$NEW_APP" "$APP_DST"
codesign --verify --deep --strict --verbose=2 "$APP_DST"
```

验签通过后，说明这个 `.app` 至少在代码签名层面可用。

### 3. 用正式包完成一次真实登录

直接打开：

```text
/Applications/Folo.app
```

然后正常完成登录流程。

### 4. 启动开发版 Electron

```bash
cd apps/desktop
pnpm run dev:electron
```

如果一切正常，开发版主进程日志里应该看到：

```text
API Response: 200 OK
```

如果还是未登录，主进程通常会出现：

```text
API Response: 401 Unauthorized
```

## 本次实际验证结果

本次调试中，最终确认如下：

- 正式包可以正常启动
- 用户完成登录后
- 有效会话 cookie 实际写入了：

```text
~/Library/Application Support/Folo(dev)/Cookies
```

而不是：

```text
~/Library/Application Support/Folo/Cookies
```

最终在 `Folo(dev)` 里查到了真实会话：

```text
api.folo.is | __Secure-better-auth.session_token
```

所以对调试来说，最关键的不是“理论上哪个目录应该存登录态”，而是要实际检查 cookie 落到了哪个目录。

## 如何验证登录态

### 1. 检查开发版目录是否已有 session cookie

```bash
sqlite3 "$HOME/Library/Application Support/Folo(dev)/Cookies" \
  "select host_key,name,length(value),length(encrypted_value),is_httponly,is_secure \
   from cookies where name='__Secure-better-auth.session_token';"
```

如果有结果，说明开发版目录已经存在可用登录态。

### 2. 检查正式包目录

```bash
sqlite3 "$HOME/Library/Application Support/Folo/Cookies" \
  "select host_key,name,length(value),length(encrypted_value),is_httponly,is_secure \
   from cookies where name='__Secure-better-auth.session_token';"
```

如果这里没有结果，不代表登录没成功，只代表登录态没有落在这个目录。

### 3. 通过运行日志判断是否登录成功

开发版或正式包启动后，关注主进程日志：

- 成功：

```text
API Response: 200 OK
```

- 未登录：

```text
API Response: 401 Unauthorized
```

## one-time token 调试的结论

本次调试也确认了 one-time token 的几个关键事实：

- 网页登录页生成的是一次性 token
- Electron 收到 deeplink 后，默认会立刻自动 apply
- 同一个 token 一旦被自动消费，再手动贴到输入框里，失败是预期行为

这也是为什么后面改成“先用正式包完成真实登录，再调开发版”会更稳。

## 手动接管模式说明

之前为了调试 deeplink token，主进程里加过一个本地开关文件：

```text
~/Library/Application Support/Folo/debug/manual-auth-token-mode
```

它存在时：

- deeplink 里的 token 仍然会落盘
- 但不会自动调用 `applyOneTimeToken(token)`

恢复正常行为时，只需要删除这个文件。

## 这次踩过的坑

### 1. 不要直接热替换安装版 `app.asar`

曾经尝试过直接替换：

```text
/Applications/Folo.app/Contents/Resources/app.asar
```

这会触发 Electron 的 asar integrity 校验失败，应用启动即崩。

结论：

- 不要直接手改安装版 `app.asar`
- 正确做法是重新跑 `electron-forge package`

### 2. `codesign --verify` 通过，不代表 Electron 一定能启动

光看 macOS 代码签名通过还不够，Electron 还会校验自己的 `asar integrity`。

所以验证时要做两件事：

1. `codesign --verify`
2. 真实启动 `.app`

### 3. `dev:web` 不适合继续追 one-time token 手动输入

虽然 `dev:web` 和当前仓库默认配置大概率仍然指向生产的 `api/web` 地址，但这条链路受一次性 token 消费、deeplink、会话写入时机等因素影响较多，不适合作为首选验证路径。

更稳的路径仍然是：

1. 正式包真实登录
2. 再切回 `dev:electron`

## 当前更稳的调试策略

后续如果还要继续调桌面端登录相关问题，优先用下面这条：

1. 先重新打正式 `.app`
2. 放到 `/Applications/Folo.app`
3. 用正式包真实登录
4. 检查登录态到底落在 `Folo` 还是 `Folo(dev)`
5. 启动 `pnpm run dev:electron`
6. 用主进程日志里的 `200 OK / 401 Unauthorized` 作为最终判断

## 相关文件

- [`apps/desktop/forge.config.cts`](/Users/dustin/.codex/worktrees/ee0b/Folo/apps/desktop/forge.config.cts)
- [`apps/desktop/layer/main/src/manager/bootstrap.ts`](/Users/dustin/.codex/worktrees/ee0b/Folo/apps/desktop/layer/main/src/manager/bootstrap.ts)
- [`apps/desktop/layer/main/src/updater/configs.ts`](/Users/dustin/.codex/worktrees/ee0b/Folo/apps/desktop/layer/main/src/updater/configs.ts)
- [`apps/desktop/layer/renderer/src/modules/auth/TokenModal.tsx`](/Users/dustin/.codex/worktrees/ee0b/Folo/apps/desktop/layer/renderer/src/modules/auth/TokenModal.tsx)
- [`wiki/desktop-local-packaging.md`](/Users/dustin/.codex/worktrees/ee0b/Folo/wiki/desktop-local-packaging.md)
