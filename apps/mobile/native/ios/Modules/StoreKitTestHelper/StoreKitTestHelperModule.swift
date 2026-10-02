import ExpoModulesCore
import Foundation
#if STOREKIT_TESTING && canImport(StoreKitTest)
import Darwin
import StoreKit
import StoreKitTest
#endif

public class StoreKitTestHelperModule: Module {
  #if STOREKIT_TESTING && canImport(StoreKitTest)
    private static var session: SKTestSession?
    private static var readinessProbeId: String?
  #endif

  public func definition() -> ModuleDefinition {
    Name("StoreKitTestHelper")

    AsyncFunction("prepareLocalSubscriptions") { () async throws -> [String: Any] in
      #if STOREKIT_TESTING && canImport(StoreKitTest)
        // StoreKitTest aborts instead of throwing when its XCTest runtime is
        // unavailable in a standalone simulator launch. Check it first.
        guard dlopen("/Developer/Library/Frameworks/XCTest.framework/XCTest", RTLD_LAZY) != nil else {
          throw NSError(domain: "StoreKitTestHelper", code: 5, userInfo: [NSLocalizedDescriptionKey: "XCTest runtime unavailable; launch with the Xcode simulator framework search paths"])
        }
        guard let storeKitFileURL = Bundle.main.url(
          forResource: "Folo - Follow everything", withExtension: "storekit"
        ) else {
          throw NSError(domain: "StoreKitTestHelper", code: 4, userInfo: [NSLocalizedDescriptionKey: "Bundled StoreKit test configuration not found"])
        }

        // Some simulator runtimes silently fail to save the StoreKit config.
        // A unique local-only product proves that requests use this session,
        // rather than falling through to an Apple account sign-in prompt.
        guard var configuration = try JSONSerialization.jsonObject(with: Data(contentsOf: storeKitFileURL)) as? [String: Any] else {
          throw NSError(domain: "StoreKitTestHelper", code: 7, userInfo: [NSLocalizedDescriptionKey: "Invalid bundled StoreKit test configuration"])
        }
        let probeId = ProcessInfo.processInfo.environment["FOLO_E2E_STOREKIT_PROBE_ID"]
          ?? "is.follow.e2e.probe.\(UUID().uuidString.lowercased())"
        guard probeId.hasPrefix("is.follow.e2e.probe.") else {
          throw NSError(domain: "StoreKitTestHelper", code: 8, userInfo: [NSLocalizedDescriptionKey: "Invalid local StoreKit readiness probe identifier"])
        }
        var products = configuration["products"] as? [[String: Any]] ?? []
        products.append([
          "displayPrice": "0.01",
          "familyShareable": false,
          "internalID": String(UInt64.random(in: 1...UInt64(Int64.max))),
          "localizations": [["description": "Local test readiness probe", "displayName": "Local Test Probe", "locale": "en_US"]],
          "productID": probeId,
          "referenceName": "Local Test Probe",
          "type": "NonConsumable",
        ])
        configuration["products"] = products
        let localConfigurationURL = FileManager.default.temporaryDirectory
          .appendingPathComponent("Folo-\(UUID().uuidString).storekit")
        try JSONSerialization.data(withJSONObject: configuration).write(to: localConfigurationURL)
        let session = try SKTestSession(contentsOf: localConfigurationURL)
        session.resetToDefaultState()
        session.clearTransactions()
        session.disableDialogs = true
        session.askToBuyEnabled = false
        session.locale = Locale(identifier: "en_US")
        session.storefront = "SGP"
        var probeProducts: [Product] = []
        for _ in 0..<10 {
          probeProducts = try await Product.products(for: [probeId])
          if probeProducts.contains(where: { $0.id == probeId }) { break }
          try await Task.sleep(nanoseconds: 500_000_000)
        }
        NSLog("[StoreKit E2E] local-probe products=%ld dialogs-disabled=%d", probeProducts.count, session.disableDialogs)
        if probeProducts.isEmpty {
          let knownIds = ["is.follow.propreview", "is.follow.basic.monthly", "is.follow.basic.yearly", "is.follow.plus.monthly", "is.follow.plus.yearly", "is.follow.pro.monthly", "is.follow.pro.yearly"]
          let knownProducts = try await Product.products(for: knownIds)
          NSLog("[StoreKit E2E] local-catalog known-products=%ld expected=%ld", knownProducts.count, knownIds.count)
        }
        guard session.disableDialogs, probeProducts.contains(where: { $0.id == probeId }) else {
          throw NSError(domain: "StoreKitTestHelper", code: 6, userInfo: [NSLocalizedDescriptionKey: "Local StoreKit configuration is not active; refusing to purchase"])
        }
        if #available(iOS 17.0, *),
          ProcessInfo.processInfo.environment["FOLO_E2E_STOREKIT_CANCEL_ONCE"] == "1"
        {
          try await session.setSimulatedError(.generic(.userCancelled), forAPI: .purchase)
        }
        Self.session = session
        Self.readinessProbeId = probeId

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

    AsyncFunction("clearPurchaseError") { () async throws in
      #if STOREKIT_TESTING && canImport(StoreKitTest)
        if #available(iOS 17.0, *), let session = Self.session {
          try await session.setSimulatedError(nil, forAPI: .purchase)
          // On iOS 18.5, clearing an injected cancellation can leave purchases
          // failing with an unknown StoreKit error even when simulatedError is
          // nil. Reset test settings without deleting existing transactions.
          session.resetToDefaultState()
          session.disableDialogs = true
          session.askToBuyEnabled = false
          session.locale = Locale(identifier: "en_US")
          session.storefront = "SGP"
          let error = await session.simulatedError(forAPI: .purchase)
          let probeProducts = try await Product.products(for: [Self.readinessProbeId].compactMap { $0 })
          guard error == nil, session.disableDialogs,
            probeProducts.contains(where: { $0.id == Self.readinessProbeId })
          else {
            throw NSError(domain: "StoreKitTestHelper", code: 9, userInfo: [NSLocalizedDescriptionKey: "Local StoreKit purchase error could not be cleared"])
          }
          NSLog("[StoreKit E2E] purchase-error-cleared")
        }
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
