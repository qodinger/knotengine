import { IBlockchainProvider } from "./provider-interface.js";

/**
 * 🛰️ Tatum Blockchain Provider
 *
 * Handles automated subscription management for merchants.
 */
export class TatumProvider implements IBlockchainProvider {
  public readonly name = "tatum";
  private readonly API_URL = "https://api.tatum.io/v3/subscription";

  /**
   * Subscribes to transaction notifications for a specific blockchain address.
   */
  public async subscribeAddress(
    address: string,
    chain: string,
    webhookUrl: string,
  ) {
    const apiKey = process.env.TATUM_API_KEY;
    if (!apiKey) return null;

    // Map internal currency symbols to Tatum chains
    const chainMap: Record<string, string> = {
      BTC: "BTC",
      LTC: "LTC",
      ETH: "ETH",
      USDT_ERC20: "ETH",
      USDT_POLYGON: "MATIC",
    };

    const tatumChain = chainMap[chain] || chain;

    try {
      console.log(`📡 Tatum: Subscribing to ${tatumChain} address: ${address}`);

      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          type: "ADDRESS_TRANSACTION",
          attr: {
            address,
            chain: tatumChain,
            url: webhookUrl,
          },
        }),
      });

      const data = (await response.json()) as { id: string };

      if (!response.ok) {
        console.error("❌ Tatum API Error:", data);
        return null;
      }

      console.log(`✅ Tatum subscription created for address: ${data.id}`);
      return data.id;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("❌ Tatum Provider Error:", message);
      return null;
    }
  }

  /**
   * Deletes a subscription when no longer needed (e.g. invoice confirmed or expired).
   */
  public async deleteSubscription(subscriptionId: string) {
    const apiKey = process.env.TATUM_API_KEY;
    if (!apiKey || !subscriptionId) return;

    try {
      await fetch(`${this.API_URL}/${subscriptionId}`, {
        method: "DELETE",
        headers: { "x-api-key": apiKey },
      });
      console.log(`🗑️ Tatum subscription deleted: ${subscriptionId}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("❌ Tatum Delete Error:", message);
    }
  }

  /**
   * Automatically subscribes a merchant's xPub via Virtual Account.
   */
  public async subscribeMerchantXpub(_xpub: string, _webhookUrl: string) {
    // For now, we prefer address-level monitoring as it is more non-custodial
    // and doesn't require creating Tatum Ledger accounts for merchants.
    console.log(
      "ℹ️ Tatum: xPub auto-registration skipped (using address-level instead).",
    );
    return null;
  }
}
