import AuthenticationServices
import Foundation

// MARK: - Apple Sign In Helper for Electron

/// A command-line tool that performs native Sign in with Apple authentication.
/// Outputs JSON with the authentication result or error.

class AppleSignInHelper: NSObject, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
    private var result: Result<AppleAuthResult, Error>?
    private var isComplete = false

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

    func performSignIn() -> Result<AppleAuthResult, Error> {
        let appleIDProvider = ASAuthorizationAppleIDProvider()
        let request = appleIDProvider.createRequest()
        request.requestedScopes = [.fullName, .email]

        let authorizationController = ASAuthorizationController(authorizationRequests: [request])
        authorizationController.delegate = self
        authorizationController.presentationContextProvider = self
        authorizationController.performRequests()

        // Use RunLoop to wait for the result without blocking delegate callbacks
        // This allows the main thread to continue processing events (including delegate callbacks)
        while !isComplete {
            RunLoop.current.run(mode: .default, before: Date(timeIntervalSinceNow: 0.1))
        }

        return result ?? .failure(AppleSignInError.unknown)
    }

    private func complete(with result: Result<AppleAuthResult, Error>) {
        self.result = result
        self.isComplete = true
    }

    // MARK: - ASAuthorizationControllerDelegate

    func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
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
        if let authError = error as? ASAuthorizationError {
            switch authError.code {
            case .canceled:
                complete(with: .failure(AppleSignInError.canceled))
            case .failed:
                complete(with: .failure(AppleSignInError.failed(error.localizedDescription)))
            case .invalidResponse:
                complete(with: .failure(AppleSignInError.failed("Invalid response from Apple")))
            case .notHandled:
                complete(with: .failure(AppleSignInError.failed("Request not handled")))
            case .notInteractive:
                complete(with: .failure(AppleSignInError.failed("Not interactive")))
            case .unknown, .matchedExcludedCredential, .credentialImport, .credentialExport,
                 .preferSignInWithApple, .deviceNotConfiguredForPasskeyCreation:
                complete(with: .failure(AppleSignInError.unknown))
            @unknown default:
                complete(with: .failure(AppleSignInError.unknown))
            }
        } else {
            complete(with: .failure(AppleSignInError.failed(error.localizedDescription)))
        }
    }

    // MARK: - ASAuthorizationControllerPresentationContextProviding

    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        // Return the key window or create a new window if needed
        if let window = NSApplication.shared.keyWindow {
            return window
        }
        // Create a temporary window for the authorization UI
        let window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 1, height: 1),
            styleMask: [],
            backing: .buffered,
            defer: false
        )
        window.makeKeyAndOrderFront(nil)
        return window
    }
}

// MARK: - Main Entry Point

struct OutputResult: Codable {
    let success: Bool
    let data: AppleSignInHelper.AppleAuthResult?
    let error: String?
}

// Start the NSApplication to get access to windows and enable UI
let app = NSApplication.shared
app.setActivationPolicy(.accessory)

let helper = AppleSignInHelper()

// performSignIn uses RunLoop to wait without blocking delegate callbacks
let result = helper.performSignIn()

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

// Exit with appropriate code
exit(result.isSuccess ? 0 : 1)

extension Result {
    var isSuccess: Bool {
        if case .success = self { return true }
        return false
    }
}
