import ExpoModulesCore
import Foundation
#if STOREKIT_TESTING && canImport(StoreKitTest)
import StoreKit
import StoreKitTest
#endif

public class StoreKitTestHelperModule: Module {
  #if STOREKIT_TESTING && canImport(StoreKitTest)
    private static var session: SKTestSession?
  #endif

  public func definition() -> ModuleDefinition {
    Name("StoreKitTestHelper")

    AsyncFunction("prepareLocalSubscriptions") { () -> [String: Any] in
      #if STOREKIT_TESTING && canImport(StoreKitTest)
        let moduleFileURL = URL(fileURLWithPath: #filePath)
        let appRootURL = moduleFileURL
          .deletingLastPathComponent()
          .deletingLastPathComponent()
          .deletingLastPathComponent()
          .deletingLastPathComponent()
        let storeKitFileURL = appRootURL
          .appendingPathComponent("ios")
          .appendingPathComponent("Folo - Follow everything.storekit")

        let session = try SKTestSession(contentsOf: storeKitFileURL)
        session.disableDialogs = true
        session.askToBuyEnabled = false
        session.locale = Locale(identifier: "en_US")
        session.storefront = "SGP"
        session.resetToDefaultState()
        session.clearTransactions()
        Self.session = session

        return [
          "enabled": true,
          "path": storeKitFileURL.path,
        ]
      #else
        return [
          "enabled": false,
        ]
      #endif
    }

    AsyncFunction("buyProduct") { (productId: String) async throws -> [String: Any] in
      #if STOREKIT_TESTING && canImport(StoreKitTest)
        guard let session = Self.session else {
          throw NSError(domain: "StoreKitTestHelper", code: 1, userInfo: [NSLocalizedDescriptionKey: "SKTestSession not prepared"])
        }
        if #available(iOS 17.0, *) {
          _ = try await session.buyProduct(identifier: productId)
          guard let transaction = await Transaction.latest(for: productId) else {
            throw NSError(domain: "StoreKitTestHelper", code: 2, userInfo: [NSLocalizedDescriptionKey: "StoreKit transaction not found"])
          }
          return [
            "success": true,
            "productId": productId,
            "jwsRepresentation": transaction.jwsRepresentation,
          ]
        }
        throw NSError(domain: "StoreKitTestHelper", code: 3, userInfo: [NSLocalizedDescriptionKey: "StoreKitTest purchases require iOS 17 or newer"])
      #else
        return [
          "success": false,
          "productId": productId,
        ]
      #endif
    }
  }
}
