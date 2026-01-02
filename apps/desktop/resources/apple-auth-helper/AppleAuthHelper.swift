import AuthenticationServices
import Foundation

// MARK: - Apple Sign In Helper for Electron

/// A helper tool that performs native Sign in with Apple authentication.
/// Outputs JSON with the authentication result or error.

class AppleSignInHelper: NSObject, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
    private var result: Result<AppleAuthResult, Error>?
    private var presentationWindow: NSWindow?
    private var authController: ASAuthorizationController?

    struct AppleAuthResult: Codable {
        let identityToken: String
        let authorizationCode: String
        let user: String
        let email: String?
        let fullName: FullName?

        struct FullName: Codable {
            let givenName: String?
            let familyName: String?
        }
    }

    enum AppleSignInError: Error, LocalizedError {
        case canceled
        case failed(String)
        case invalidCredential
        case unknown

        var errorDescription: String? {
            switch self {
            case .canceled:
                return "User canceled the Sign in with Apple request"
            case .failed(let message):
                return message
            case .invalidCredential:
                return "Invalid credential received from Apple"
            case .unknown:
                return "Unknown error occurred"
            }
        }
    }

    func startSignIn() {
        fputs("[AppleAuthHelper] Creating authorization request...\n", stderr)

        let appleIDProvider = ASAuthorizationAppleIDProvider()
        let request = appleIDProvider.createRequest()
        request.requestedScopes = [.fullName, .email]

        let controller = ASAuthorizationController(authorizationRequests: [request])
        controller.delegate = self
        controller.presentationContextProvider = self

        // Keep a strong reference to prevent premature deallocation
        self.authController = controller

        fputs("[AppleAuthHelper] Performing authorization request...\n", stderr)
        controller.performRequests()
    }

    private func complete(with result: Result<AppleAuthResult, Error>) {
        fputs("[AppleAuthHelper] Completing with result...\n", stderr)
        self.result = result

        // Close the presentation window and stop the app on the main thread
        DispatchQueue.main.async {
            self.presentationWindow?.close()
            self.presentationWindow = nil
            NSApp.stop(nil)
        }
    }

    func getResult() -> Result<AppleAuthResult, Error> {
        return result ?? .failure(AppleSignInError.unknown)
    }

    // MARK: - ASAuthorizationControllerDelegate

    func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        fputs("[AppleAuthHelper] Authorization completed successfully\n", stderr)

        guard let appleIDCredential = authorization.credential as? ASAuthorizationAppleIDCredential else {
            complete(with: .failure(AppleSignInError.invalidCredential))
            return
        }

        guard let identityTokenData = appleIDCredential.identityToken,
              let identityToken = String(data: identityTokenData, encoding: .utf8) else {
            complete(with: .failure(AppleSignInError.failed("Failed to get identity token")))
            return
        }

        guard let authorizationCodeData = appleIDCredential.authorizationCode,
              let authorizationCode = String(data: authorizationCodeData, encoding: .utf8) else {
            complete(with: .failure(AppleSignInError.failed("Failed to get authorization code")))
            return
        }

        var fullName: AppleAuthResult.FullName?
        if let name = appleIDCredential.fullName {
            fullName = AppleAuthResult.FullName(
                givenName: name.givenName,
                familyName: name.familyName
            )
        }

        let authResult = AppleAuthResult(
            identityToken: identityToken,
            authorizationCode: authorizationCode,
            user: appleIDCredential.user,
            email: appleIDCredential.email,
            fullName: fullName
        )

        complete(with: .success(authResult))
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        fputs("[AppleAuthHelper] Authorization failed with error: \(error.localizedDescription)\n", stderr)

        if let authError = error as? ASAuthorizationError {
            switch authError.code {
            case .canceled:
                complete(with: .failure(AppleSignInError.canceled))
            case .failed:
                complete(with: .failure(AppleSignInError.failed("Authorization failed: \(error.localizedDescription)")))
            case .invalidResponse:
                complete(with: .failure(AppleSignInError.failed("Invalid response from Apple: \(error.localizedDescription)")))
            case .notHandled:
                complete(with: .failure(AppleSignInError.failed("Request not handled: \(error.localizedDescription)")))
            case .notInteractive:
                complete(with: .failure(AppleSignInError.failed("Not interactive: \(error.localizedDescription)")))
            case .unknown:
                complete(with: .failure(AppleSignInError.failed("Unknown error (code: \(authError.code.rawValue)): \(error.localizedDescription)")))
            case .matchedExcludedCredential:
                complete(with: .failure(AppleSignInError.failed("Matched excluded credential: \(error.localizedDescription)")))
            case .credentialImport:
                complete(with: .failure(AppleSignInError.failed("Credential import error: \(error.localizedDescription)")))
            case .credentialExport:
                complete(with: .failure(AppleSignInError.failed("Credential export error: \(error.localizedDescription)")))
            case .preferSignInWithApple:
                complete(with: .failure(AppleSignInError.failed("Prefer Sign in with Apple: \(error.localizedDescription)")))
            case .deviceNotConfiguredForPasskeyCreation:
                complete(with: .failure(AppleSignInError.failed("Device not configured for passkey creation: \(error.localizedDescription)")))
            @unknown default:
                complete(with: .failure(AppleSignInError.failed("Unknown authorization error (code: \(authError.code.rawValue)): \(error.localizedDescription)")))
            }
        } else {
            complete(with: .failure(AppleSignInError.failed("Non-authorization error: \(error.localizedDescription)")))
        }
    }

    // MARK: - ASAuthorizationControllerPresentationContextProviding

    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        fputs("[AppleAuthHelper] Creating presentation anchor...\n", stderr)

        // Return an existing window if available
        if let window = NSApplication.shared.keyWindow {
            fputs("[AppleAuthHelper] Using existing key window\n", stderr)
            return window
        }

        // Create a minimal transparent window as the anchor for the Sign in with Apple sheet
        // The system's Sign in with Apple UI appears as a popover anchored to this window
        let window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 1, height: 1),
            styleMask: [],  // No title bar, no decorations
            backing: .buffered,
            defer: false
        )
        window.isOpaque = false
        window.backgroundColor = .clear
        window.hasShadow = false
        window.level = .modalPanel
        window.center()
        window.orderFrontRegardless()

        self.presentationWindow = window
        fputs("[AppleAuthHelper] Created minimal transparent window\n", stderr)
        return window
    }
}

// MARK: - Main Entry Point

struct OutputResult: Codable {
    let success: Bool
    let data: AppleSignInHelper.AppleAuthResult?
    let error: String?
}

fputs("[AppleAuthHelper] Starting...\n", stderr)

// Initialize the application
let app = NSApplication.shared

// Use .accessory so the app doesn't appear in the Dock
// but can still present system UI elements like Sign in with Apple
app.setActivationPolicy(.accessory)

// Activate the app to allow system dialogs to appear
app.activate(ignoringOtherApps: true)

fputs("[AppleAuthHelper] App initialized with accessory policy, starting sign in...\n", stderr)

let helper = AppleSignInHelper()
helper.startSignIn()

// Run the standard Cocoa event loop
// This properly handles all events including Touch ID authentication
// The loop exits when NSApp.stop() is called from the completion handler
fputs("[AppleAuthHelper] Running app event loop...\n", stderr)
app.run()

fputs("[AppleAuthHelper] App event loop ended\n", stderr)

// Get the result after the run loop exits
let result = helper.getResult()

let output: OutputResult
switch result {
case .success(let authResult):
    output = OutputResult(success: true, data: authResult, error: nil)
case .failure(let error):
    output = OutputResult(success: false, data: nil, error: error.localizedDescription)
}

// Output JSON to stdout
let encoder = JSONEncoder()
encoder.outputFormatting = .prettyPrinted
if let jsonData = try? encoder.encode(output),
   let jsonString = String(data: jsonData, encoding: .utf8) {
    print(jsonString)
} else {
    print("{\"success\": false, \"error\": \"Failed to encode result\"}")
}

fputs("[AppleAuthHelper] Done\n", stderr)

// Exit with appropriate code
exit(result.isSuccess ? 0 : 1)

extension Result {
    var isSuccess: Bool {
        if case .success = self { return true }
        return false
    }
}
