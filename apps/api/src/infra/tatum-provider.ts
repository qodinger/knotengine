/**
 * 🛰️ Tatum Blockchain Provider
 *
 * Handles automated subscription management for merchants.
 * In a SaaS model, this service creates "Account" subscriptions
 * on Tatum so the platform is notified of every incoming transaction.
 */
export class TatumProvider {
  private static readonly API_URL = "https://api.tatum.io/v3/subscription";

  /**
   * Subscribes to transaction notifications for a specific blockchain address.
   * This is used for granular invoice-level monitoring.
   */
  public static async subscribeAddress(
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
  public static async deleteSubscription(subscriptionId: string) {
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
   * LEGACY/Alternative: Automatically subscribes a merchant's xPub via Virtual Account.
   * Note: This requires a Tatum Ledger account which is a different workflow.
   */
  public static async subscribeMerchantXpub(
    _xpub: string,
    _webhookUrl: string,
  ) {
    // For now, we prefer address-level monitoring as it is more non-custodial
    // and doesn't require creating Tatum Ledger accounts for merchants.
    console.log(
      "ℹ️ Tatum: xPub auto-registration skipped (using address-level instead).",
    );
    return null;
  }
}
