import { inAppPurchase } from "electron"
import type { IpcContext } from "electron-ipc-decorator"
import { IpcMethod, IpcService } from "electron-ipc-decorator"

export class IAPService extends IpcService {
  static override readonly groupName = "iap"

  @IpcMethod()
  async getProducts(_context: IpcContext, productIDs: string[]) {
    return inAppPurchase.getProducts(productIDs)
  }

  @IpcMethod()
  async purchaseProduct(
    _context: IpcContext,
    productID: string,
    opts?: Electron.PurchaseProductOpts,
  ) {
    return inAppPurchase.purchaseProduct(productID, opts)
  }
}
