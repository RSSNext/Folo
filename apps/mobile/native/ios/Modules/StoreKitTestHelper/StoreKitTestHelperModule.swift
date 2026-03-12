import ExpoModulesCore
import Foundation
#if canImport(StoreKitTest)
import StoreKitTest
#endif

public class StoreKitTestHelperModule: Module {
  #if canImport(StoreKitTest)
    private static var session: SKTestSession?
  #endif

  public func definition() -> ModuleDefinition {
    Name("StoreKitTestHelper")

    AsyncFunction("prepareLocalSubscriptions") { () -> [String: Any] in
      #if canImport(StoreKitTest)
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
      #if canImport(StoreKitTest)
        guard let session = Self.session else {
          throw NSError(domain: "StoreKitTestHelper", code: 1, userInfo: [NSLocalizedDescriptionKey: "SKTestSession not prepared"])
        }
        let transaction = try await session.buyProduct(identifier: productId)
        return [
          "success": true,
          "productId": productId,
          "jwsRepresentation": transaction.jwsRepresentation,
        ]
      #else
        return [
          "success": false,
          "productId": productId,
        ]
      #endif
    }
  }
}
