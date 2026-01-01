import AuthenticationServices
import Foundation

// MARK: - Apple Sign In Helper for Electron

/// A command-line tool that performs native Sign in with Apple authentication.
/// Outputs JSON with the authentication result or error.

class AppleSignInHelper: NSObject, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
    private var completion: ((Result<AppleAuthResult, Error>) -> Void)?
    private let dispatchGroup = DispatchGroup()

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
        dispatchGroup.enter()
        var result: Result<AppleAuthResult, Error> = .failure(AppleSignInError.unknown)

        let appleIDProvider = ASAuthorizationAppleIDProvider()
        let request = appleIDProvider.createRequest()
        request.requestedScopes = [.fullName, .email]

        let authorizationController = ASAuthorizationController(authorizationRequests: [request])
        authorizationController.delegate = self
        authorizationController.presentationContextProvider = self
        authorizationController.performRequests()

        self.completion = { res in
            result = res
            self.dispatchGroup.leave()
        }

        // Wait for the result
        dispatchGroup.wait()
        return result
    }

    // MARK: - ASAuthorizationControllerDelegate

    func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        guard let appleIDCredential = authorization.credential as? ASAuthorizationAppleIDCredential else {
            completion?(.failure(AppleSignInError.invalidCredential))
            return
        }

        guard let identityTokenData = appleIDCredential.identityToken,
              let identityToken = String(data: identityTokenData, encoding: .utf8) else {
            completion?(.failure(AppleSignInError.failed("Failed to get identity token")))
            return
        }

        guard let authorizationCodeData = appleIDCredential.authorizationCode,
              let authorizationCode = String(data: authorizationCodeData, encoding: .utf8) else {
            completion?(.failure(AppleSignInError.failed("Failed to get authorization code")))
            return
        }

        var fullName: AppleAuthResult.FullName?
        if let name = appleIDCredential.fullName {
            fullName = AppleAuthResult.FullName(
                givenName: name.givenName,
                familyName: name.familyName
            )
        }

        let result = AppleAuthResult(
            identityToken: identityToken,
            authorizationCode: authorizationCode,
            user: appleIDCredential.user,
            email: appleIDCredential.email,
            fullName: fullName
        )

        completion?(.success(result))
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        if let authError = error as? ASAuthorizationError {
            switch authError.code {
            case .canceled:
                completion?(.failure(AppleSignInError.canceled))
            case .failed:
                completion?(.failure(AppleSignInError.failed(error.localizedDescription)))
            case .invalidResponse:
                completion?(.failure(AppleSignInError.failed("Invalid response from Apple")))
            case .notHandled:
                completion?(.failure(AppleSignInError.failed("Request not handled")))
            case .notInteractive:
                completion?(.failure(AppleSignInError.failed("Not interactive")))
            case .unknown, .matchedExcludedCredential, .credentialImport, .credentialExport,
                 .preferSignInWithApple, .deviceNotConfiguredForPasskeyCreation:
                completion?(.failure(AppleSignInError.unknown))
            @unknown default:
                completion?(.failure(AppleSignInError.unknown))
            }
        } else {
            completion?(.failure(AppleSignInError.failed(error.localizedDescription)))
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

// Ensure we have access to the main thread for UI operations
if Thread.isMainThread {
    runSignIn()
} else {
    DispatchQueue.main.sync {
        runSignIn()
    }
}

func runSignIn() {
    // Start the NSApplication to get access to windows
    let app = NSApplication.shared
    app.setActivationPolicy(.accessory)

    let helper = AppleSignInHelper()

    // Run the sign in on a background queue and wait
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

    // Exit
    exit(result.isSuccess ? 0 : 1)
}

extension Result {
    var isSuccess: Bool {
        if case .success = self { return true }
        return false
    }
}
