# Android SharedWebView with Image Interception Implementation

## Objective

Implement an Android equivalent of the iOS SharedWebView module with advanced image interception capabilities using WebView hooks instead of custom URL schemes. This will provide feature parity between iOS and Android platforms while leveraging Android's superior request interception capabilities.

## Context

The iOS implementation uses a custom URL scheme (`follow-image://`) to intercept image requests due to WKWebView limitations. Android WebView offers more powerful request interception through `WebViewClient.shouldInterceptRequest()`, allowing for a more elegant and performant solution.

### Current iOS Architecture (Reference)

- **SharedWebViewModule** (apps/mobile/native/ios/Modules/SharedWebView/SharedWebViewModule.swift)
- **WebViewManager** (apps/mobile/native/ios/Modules/SharedWebView/WebViewManager.swift) - Singleton with lifecycle management
- **FOWebView** (apps/mobile/native/ios/Modules/SharedWebView/FOWebView.swift) - Custom WKWebView
- **FollowImageURLSchemeHandler** (apps/mobile/native/ios/Modules/SharedWebView/FollowImageURLSchemeHandler.swift) - Custom scheme handler
- **WebViewState** (apps/mobile/native/ios/Modules/SharedWebView/WebViewState.swift) - Observable state management

### Existing Android Infrastructure

- **Module Path**: `apps/mobile/native/android/src/main/java/expo/modules/follownative/`
- **Build Configuration**: Standard Expo modules with Kotlin support
- **Naming Convention**: `expo.modules.follownative.modulename.ModuleName`
- **TypeScript Interface**: Already defined in `apps/mobile/src/components/native/webview/index.ts`

## Implementation Requirements

### Core Components to Implement

1. **SharedWebViewModule.kt** - Main Expo module exposing API to React Native
2. **WebViewManager.kt** - Singleton manager for WebView lifecycle and state
3. **SharedWebViewView.kt** - Expo view component
4. **FOWebView.kt** - Custom WebView with image interception
5. **ImageInterceptClient.kt** - WebViewClient with request interception
6. **ImageCache.kt** - Memory and disk caching system
7. **WebViewState.kt** - Reactive state management with StateFlow
8. **BridgeData.kt** - Message payloads and type definitions

### API Compatibility Requirements

Maintain 100% compatibility with existing TypeScript interface:

```typescript
interface ISharedWebViewModule
  extends NativeModule<{
    onContentHeightChanged: ({ height }: { height: number }) => void
    onImagePreview: (event: ImagePreviewEvent) => void
    onSeekAudio?: (e: { time: number }) => void
  }> {
  load(url: string): void
  evaluateJavaScript(js: string): void
  dispatch?(type: string, payload?: string): void

  // Debug helpers
  getDebugState?(): WebViewDebugState
  destroyForDebug?(): void
  reloadLastURL?(): void
  flushQueue?(): void
}
```

## Technical Architecture

### Image Interception Strategy (Android Advantage)

**iOS Approach**: Custom URL scheme with JavaScript injection

```swift
// JavaScript injection to rewrite image URLs
url.replace(/^https?:/, 'follow-image:')
// Custom WKURLSchemeHandler for follow-image://
```

**Android Approach**: Native request interception (Superior)

```kotlin
override fun shouldInterceptRequest(view: WebView?, request: WebResourceRequest?): WebResourceResponse? {
    if (isImageRequest(request)) {
        return handleImageRequest(request)
    }
    return super.shouldInterceptRequest(view, request)
}
```

### Implementation Blueprint

#### Phase 1: Core Infrastructure (Priority 1)

```kotlin
// 1. SharedWebViewModule.kt
@ExpoModule(name = "FOSharedWebView")
class SharedWebViewModule : Module() {
    private val coroutineScope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    override fun definition() = ModuleDefinition {
        Name("FOSharedWebView")

        Function("load") { urlString: String ->
            WebViewManager.load(urlString)
        }

        Function("evaluateJavaScript") { js: String ->
            WebViewManager.evaluateJavaScript(js)
        }

        Function("dispatch") { type: String, payload: String? ->
            WebViewManager.dispatch(type, payload)
        }

        View(SharedWebViewView::class) {
            Events("onContentHeightChange", "onSeekAudio")
            Prop("url") { view: SharedWebViewView, url: String ->
                WebViewManager.load(url)
            }
        }

        Events("onContentHeightChanged", "onImagePreview", "onSeekAudio")

        OnCreate {
            WebViewManager.initializeLifecycleObservers(appContext.currentActivity!!)
        }

        OnStartObserving {
            // StateFlow subscriptions for reactive events
            WebViewManager.state.contentHeight.onEach { height ->
                sendEvent("onContentHeightChanged", mapOf("height" to height))
            }.launchIn(coroutineScope)
        }

        OnStopObserving {
            coroutineScope.cancel()
        }

        // Debug functions
        Function("getDebugState") { WebViewManager.getDebugState() }
        Function("destroyForDebug") { WebViewManager.destroyForDebug() }
        Function("reloadLastURL") { WebViewManager.reloadLastURL() }
        Function("flushQueue") { WebViewManager.flushQueue() }
    }
}
```

```kotlin
// 2. WebViewManager.kt - Singleton with lifecycle management
object WebViewManager {
    val state = WebViewState()
    private var sharedWebView: FOWebView? = null
    private var currentHost: ViewGroup? = null
    private var isReady = false
    private val pendingScripts = mutableListOf<String>()
    private var lastUrl: String? = null
    private val lastState = mutableMapOf<String, Any>()

    fun initializeLifecycleObservers(activity: Activity) {
        val observer = object : DefaultLifecycleObserver {
            override fun onPause(owner: LifecycleOwner) { onEnterBackground() }
            override fun onResume(owner: LifecycleOwner) { onEnterForeground() }
        }
        (activity as ComponentActivity).lifecycle.addObserver(observer)
    }

    fun load(urlString: String) {
        MainScope().launch {
            lastUrl = urlString
            val webView = getOrCreateWebView()
            if (webView.url == urlString && !isLoading(webView)) return@launch
            isReady = false
            webView.loadUrl(urlString)
        }
    }

    fun attach(host: ViewGroup) {
        MainScope().launch {
            val webView = getOrCreateWebView()
            (webView.parent as? ViewGroup)?.removeView(webView)
            host.addView(webView)
            currentHost = host
        }
    }

    private fun getOrCreateWebView(): FOWebView {
        return sharedWebView ?: FOWebView(context, state).also { sharedWebView = it }
    }

    private fun onEnterBackground() {
        if (currentHost == null) {
            MainScope().launch {
                delay(3000)
                if (currentHost == null) destroyWebView()
            }
        }
    }

    private fun onEnterForeground() {
        if (sharedWebView == null) {
            getOrCreateWebView()
            lastUrl?.let { load(it) }
            replayState()
        }
    }
}
```

#### Phase 2: Image Interception System (Priority 1)

```kotlin
// 3. ImageInterceptClient.kt - Advanced request interception
class ImageInterceptClient(
    private val imageCache: ImageCache,
    private val baseClient: WebViewClient? = null
) : WebViewClient() {

    companion object {
        private val IMAGE_MIME_TYPES = setOf(
            "image/jpeg", "image/jpg", "image/png", "image/gif",
            "image/webp", "image/svg+xml", "image/avif"
        )
    }

    override fun shouldInterceptRequest(
        view: WebView?,
        request: WebResourceRequest?
    ): WebResourceResponse? {
        val url = request?.url?.toString() ?: return super.shouldInterceptRequest(view, request)

        if (!isImageRequest(request)) {
            return baseClient?.shouldInterceptRequest(view, request)
                ?: super.shouldInterceptRequest(view, request)
        }

        return handleImageRequest(view, request)
    }

    private fun isImageRequest(request: WebResourceRequest): Boolean {
        val url = request.url.toString()
        val acceptHeader = request.requestHeaders["Accept"] ?: ""

        // Multi-strategy detection
        return acceptHeader.contains("image/") ||
               url.substringAfterLast('.', "").lowercase() in IMAGE_EXTENSIONS ||
               url.contains(Regex("/(images?|img|pics?|photos?|assets)/", RegexOption.IGNORE_CASE))
    }

    private fun handleImageRequest(
        view: WebView?,
        request: WebResourceRequest
    ): WebResourceResponse? {
        val url = request.url.toString()
        val cacheKey = url

        // Check cache first
        imageCache.get(cacheKey)?.let { cachedData ->
            return createImageResponse(cachedData, detectMimeType(cachedData))
        }

        // Network request with proper headers
        return try {
            val modifiedRequest = buildImageRequest(request)
            val response = executeImageRequest(modifiedRequest)

            response?.let { (data, mimeType) ->
                imageCache.put(cacheKey, data)
                createImageResponse(data, mimeType)
            }
        } catch (e: Exception) {
            Log.w("ImageIntercept", "Failed to load image: $url", e)
            null // Fallback to default WebView behavior
        }
    }

    private fun buildImageRequest(original: WebResourceRequest): HttpURLConnection {
        val connection = URL(original.url.toString()).openConnection() as HttpURLConnection

        // Copy original headers
        original.requestHeaders.forEach { (key, value) ->
            if (!isRestrictedHeader(key)) {
                connection.setRequestProperty(key, value)
            }
        }

        // Optimize for images
        connection.setRequestProperty("Accept", "image/webp,image/avif,image/*,*/*;q=0.8")
        connection.setRequestProperty("User-Agent",
            "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Mobile Safari/537.36")

        // Set referer for CORS compatibility
        original.url.let { url ->
            val referer = "${url.scheme}://${url.host}"
            connection.setRequestProperty("Referer", referer)
        }

        connection.connectTimeout = 10000
        connection.readTimeout = 15000
        return connection
    }

    private fun createImageResponse(data: ByteArray, mimeType: String): WebResourceResponse {
        val headers = mapOf(
            "Access-Control-Allow-Origin" to "*",
            "Cache-Control" to "public, max-age=3600",
            "Content-Length" to data.size.toString()
        )

        return WebResourceResponse(mimeType, "utf-8", 200, "OK", headers, ByteArrayInputStream(data))
    }
}
```

```kotlin
// 4. ImageCache.kt - High-performance caching system
class ImageCache(private val context: Context) {
    private val memoryCache = LruCache<String, ByteArray>(16 * 1024 * 1024) // 16MB
    private val diskCacheDir = File(context.cacheDir, "webview_images")

    init {
        if (!diskCacheDir.exists()) diskCacheDir.mkdirs()
    }

    fun get(key: String): ByteArray? {
        // Memory first, then disk
        return memoryCache.get(key) ?: getDiskCache(key)?.also {
            memoryCache.put(key, it)
        }
    }

    fun put(key: String, data: ByteArray) {
        memoryCache.put(key, data)
        putDiskCache(key, data)
    }

    private fun getDiskCache(key: String): ByteArray? = try {
        val file = getCacheFile(key)
        if (file.exists() && System.currentTimeMillis() - file.lastModified() < 24 * 60 * 60 * 1000) {
            file.readBytes()
        } else null
    } catch (e: Exception) { null }

    private fun putDiskCache(key: String, data: ByteArray) {
        try {
            getCacheFile(key).writeBytes(data)
        } catch (e: Exception) {
            Log.w("ImageCache", "Failed to cache image", e)
        }
    }

    private fun getCacheFile(key: String): File {
        val fileName = key.hashCode().toString(16) + ".cache"
        return File(diskCacheDir, fileName)
    }
}
```

#### Phase 3: State Management and Views (Priority 2)

```kotlin
// 5. WebViewState.kt - Reactive state management
class WebViewState {
    private val _contentHeight = MutableStateFlow(Resources.getSystem().displayMetrics.heightPixels.toFloat())
    val contentHeight: StateFlow<Float> = _contentHeight.asStateFlow()

    private val _imagePreviewEvent = MutableStateFlow<ImagePreviewEvent?>(null)
    val imagePreviewEvent: StateFlow<ImagePreviewEvent?> = _imagePreviewEvent.asStateFlow()

    private val _audioSeekEvent = MutableStateFlow<AudioSeekEvent?>(null)
    val audioSeekEvent: StateFlow<AudioSeekEvent?> = _audioSeekEvent.asStateFlow()

    fun updateContentHeight(height: Float) { _contentHeight.value = height }
    fun triggerImagePreview(urls: List<String>, index: Int) {
        _imagePreviewEvent.value = ImagePreviewEvent(urls, index)
    }
    fun triggerAudioSeek(time: Double) {
        _audioSeekEvent.value = AudioSeekEvent(time)
    }
}

data class ImagePreviewEvent(val imageUrls: List<String>, val index: Int)
data class AudioSeekEvent(val time: Double)
```

```kotlin
// 6. FOWebView.kt - Custom WebView implementation
class FOWebView(context: Context, private val state: WebViewState) : WebView(context) {

    private val imageCache = ImageCache(context)
    private val baseWebViewClient = FOWebViewClient()
    private val javascriptInterface = JavaScriptInterface(state)

    init {
        setupWebView()
        webViewClient = ImageInterceptClient(imageCache, baseWebViewClient)
        webChromeClient = FOWebChromeClient()
        addJavaScriptInterface(javascriptInterface, "Android")
    }

    private fun setupWebView() {
        settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            loadsImagesAutomatically = true
            blockNetworkImage = false
            cacheMode = WebSettings.LOAD_DEFAULT
            setAppCacheEnabled(true)
        }

        // Inject JavaScript bridge
        injectBridgeScript()
    }

    private fun injectBridgeScript() {
        val script = """
            ;(() => {
              window.__RN__ = true

              function send(data) {
                Android.postMessage(JSON.stringify(data))
              }

              window.bridge = {
                measure: () => send({ type: "measure" }),
                setContentHeight: (height) => send({ type: "setContentHeight", payload: height }),
                previewImage: (data) => send({ type: "previewImage", payload: data }),
                seekAudio: (time) => send({ type: "audio:seekTo", payload: { time } })
              }

              // Signal readiness
              document.addEventListener("DOMContentLoaded", () => {
                send({ type: "ready" })
              })
            })()
        """
        evaluateJavascript(script, null)
    }

    fun clearImageCache() { imageCache.clear() }
}
```

#### Phase 4: Integration and Testing (Priority 3)

### File Structure to Create

```
apps/mobile/native/android/src/main/java/expo/modules/follownative/sharedwebview/
├── SharedWebViewModule.kt                 # Main Expo module
├── SharedWebViewView.kt                  # Expo view component
├── WebViewManager.kt                     # Singleton WebView manager
├── FOWebView.kt                         # Custom WebView implementation
├── ImageInterceptClient.kt              # Request interception logic
├── ImageCache.kt                        # Caching system
├── WebViewState.kt                      # State management
├── BridgeData.kt                        # Message payloads
└── JavaScriptInterface.kt              # WebView-to-native bridge
```

### Configuration Updates Required

1. **expo-module.config.json** - Add new Android module:

```json
{
  "android": {
    "modules": [
      "expo.modules.follownative.sharedwebview.SharedWebViewModule"
      // ... existing modules
    ]
  }
}
```

2. **Android Gradle Dependencies** - Add to `apps/mobile/native/android/build.gradle`:

```gradle
dependencies {
    implementation "androidx.lifecycle:lifecycle-runtime-ktx:2.8.6"
    implementation "org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0"
}
```

## Implementation Tasks

### Phase 1: Core Infrastructure (Week 1)

1. Create module structure and base classes
2. Implement SharedWebViewModule.kt with Expo module definition
3. Implement WebViewManager.kt singleton with lifecycle management
4. Implement WebViewState.kt with StateFlow-based reactive state
5. Create basic SharedWebViewView.kt Expo view component

### Phase 2: Image Interception System (Week 1-2)

1. Implement ImageInterceptClient.kt with shouldInterceptRequest logic
2. Build ImageCache.kt with memory and disk caching
3. Create image request detection and classification system
4. Implement network request handling with proper headers
5. Add MIME type detection and response creation

### Phase 3: WebView Integration (Week 2)

1. Implement FOWebView.kt custom WebView
2. Create JavaScriptInterface.kt for native-JS communication
3. Add JavaScript bridge injection and message handling
4. Implement content height tracking and layout updates
5. Add debug utilities and state inspection tools

### Phase 4: Testing and Integration (Week 2-3)

1. Create comprehensive unit tests for each component
2. Implement integration tests with mock WebView scenarios
3. Add performance tests for image caching and request interception
4. Test cross-platform API compatibility with iOS implementation
5. Validate memory management and lifecycle behavior

### Phase 5: Documentation and Deployment (Week 3)

1. Update expo-module.config.json with new Android module
2. Add necessary Gradle dependencies and configurations
3. Create comprehensive documentation for the implementation
4. Update TypeScript definitions if needed
5. Perform final testing and validation

## Validation Gates

### Build Validation

```bash
cd apps/mobile/native/android
./gradlew assembleDebug
```

### Code Quality Checks

```bash
cd apps/mobile
npm run typecheck
```

### Functional Testing

```bash
# Test module loading
adb logcat | grep "FOSharedWebView"

# Test image interception
# Navigate to image-heavy content and verify cache behavior
```

### Performance Testing

```kotlin
// Measure image cache hit rates and memory usage
WebViewManager.getImageCacheStats().let { stats ->
    assertTrue("Cache hit rate should be > 80%", stats.hitRate > 0.8)
    assertTrue("Memory usage should be < 50MB", stats.memoryUsage < 50 * 1024 * 1024)
}
```

### Cross-Platform Compatibility Testing

```javascript
// Verify identical API behavior across platforms
const debugState = await SharedWebViewModule.getDebugState()
expect(debugState).toHaveProperty("hasWebView")
expect(debugState).toHaveProperty("contentHeight")
```

## Documentation and References

### Essential References

- [Expo Modules API Documentation](https://docs.expo.dev/modules/overview/)
- [Native View Tutorial](https://docs.expo.dev/modules/native-view-tutorial/)
- [Android WebView Request Interception](https://medium.com/@pouryarezaee76/intercepting-requests-in-android-webview-8eb628b32f2a)
- [WebView Security Best Practices](https://blog.oversecured.com/Android-Exploring-vulnerabilities-in-WebResourceResponse/)

### Key Implementation Files to Reference

- `apps/mobile/native/ios/Modules/SharedWebView/` - Complete iOS implementation
- `apps/mobile/native/android/src/main/java/expo/modules/follownative/FollowNativeModule.kt` - Existing module patterns
- `apps/mobile/src/components/native/webview/index.ts` - TypeScript API interface

### Critical Security Considerations

1. **Request Validation**: Always validate URLs before processing to prevent malicious requests
2. **Header Sanitization**: Filter restricted headers to prevent security vulnerabilities
3. **File Access Limiting**: Restrict file:// URL access to app bundle resources only
4. **Content Security**: Implement proper CSP headers for loaded content
5. **Bridge Data Validation**: Validate all JavaScript bridge message payloads

## Expected Outcomes

### Performance Improvements over iOS

- **No URL Rewriting Overhead**: Direct request interception vs. JavaScript URL manipulation
- **Better Error Handling**: Graceful fallback to default WebView behavior on failure
- **Enhanced Debugging**: Standard HTTP request debugging vs. custom scheme debugging
- **Improved Reliability**: No dependency on JavaScript injection success

### Feature Parity Achievement

- 100% API compatibility with iOS implementation
- Identical event handling and state management
- Same debugging capabilities and state inspection tools
- Consistent caching behavior and memory management

### Success Metrics

- Image cache hit rate > 90%
- Memory usage < 64MB for typical usage
- Zero crashes related to WebView lifecycle management
- API response time < 50ms for cached resources
- Cross-platform test suite passing rate > 99%

## Confidence Score: 9/10

This PRP provides comprehensive context, detailed implementation blueprints, existing code patterns to follow, specific file references, security considerations, and executable validation gates. The Android implementation leverages superior platform capabilities while maintaining complete API compatibility with iOS. All necessary technical context, external documentation, and testing patterns are included to enable successful one-pass implementation.
