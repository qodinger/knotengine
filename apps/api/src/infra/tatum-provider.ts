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
   * Automatically subscribes a merchant's xPub to Tatum monitoring.
   * This ensures Tatum sends us a webhook whenever the merchant receives BTC.
   */
  public static async subscribeMerchantXpub(xpub: string, webhookUrl: string) {
    const apiKey = process.env.TATUM_API_KEY;

    if (!apiKey) {
      console.warn(
        "⚠️ Tatum Provider: Missing TATUM_API_KEY. Auto-subscription skipped.",
      );
      return null;
    }

    try {
      console.log(
        `📡 Registering xPub with Tatum: ${xpub.substring(0, 10)}...`,
      );

      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          type: "ACCOUNT_INCOMING_BLOCKCHAIN_TRANSACTION",
          attr: {
            id: xpub,
            url: webhookUrl,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create Tatum subscription");
      }

      console.log(`✅ Tatum subscription created: ${data.id}`);
      return data.id;
    } catch (error: any) {
      console.error("❌ Tatum Provider Error:", error.message);
      // We don't throw here to avoid breaking the merchant registration flow
      // but in production, you might want to retry this via a background job.
      return null;
    }
  }
}
