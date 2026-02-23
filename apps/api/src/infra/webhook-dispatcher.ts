import { Invoice, IInvoice, Merchant } from "@qodinger/knot-database";
import { Derivator } from "@qodinger/knot-crypto";
import * as crypto from "crypto";
import { NotificationService } from "./notification-service.js";

/**
 * 📡 WebhookDispatcher
 *
 * Delivers payment status updates to merchant webhook URLs.
 * Features:
 *   - HMAC-SHA256 signed payloads
 *   - Retry tracking (up to 5 attempts)
 *   - Idempotency via invoice state checks
 */
export class WebhookDispatcher {
  /** Max retries: ~24 hours of total retry time with exponential backoff */
  private static MAX_ATTEMPTS = 10;
  private static INITIAL_BACKOFF_MINUTES = 2;

  /**
   * Dispatches a webhook notification to the merchant for an invoice event.
   */
  public static async dispatch(
    invoiceId: string,
    event: string,
  ): Promise<boolean> {
    const invoice = await Invoice.findOne({ invoiceId });

    if (!invoice) {
      console.error(`WebhookDispatcher: Invoice ${invoiceId} not found`);
      return false;
    }

    // Check if webhook was already delivered for this status
    // This provides idempotency at the dispatcher level
    if (invoice.webhookDelivered && event === "invoice.confirmed") {
      console.log(
        `📡 Webhook already delivered for invoice ${invoiceId}. Skipping.`,
      );
      return true;
    }

    const merchant = await Merchant.findById(invoice.merchantId);

    if (!merchant?.webhookUrl) {
      return false;
    }

    // Check if merchant is subscribed to this event
    const subscribedEvents = merchant.webhookEvents || [
      "invoice.confirmed",
      "invoice.mempool_detected",
      "invoice.partially_paid",
      "invoice.overpaid",
      "invoice.expired",
      "invoice.failed",
    ];

    if (!subscribedEvents.includes(event)) {
      console.log(
        `📡 Webhook skipped. Merchant is not subscribed to '${event}'.`,
      );
      return true;
    }

    const payload = {
      id: `evt_${crypto.randomBytes(12).toString("hex")}`,
      event,
      created: Math.floor(Date.now() / 1000),
      invoice_id: invoice.invoiceId,
      status: invoice.status,
      amount: {
        usd: invoice.amountUsd,
        crypto: invoice.cryptoAmount,
        crypto_received: invoice.cryptoAmountReceived || 0,
        currency: invoice.cryptoCurrency,
        fee_usd: invoice.feeUsd,
      },
      payment: {
        address: invoice.payAddress,
        tx_hash: invoice.txHash || null,
        confirmations: invoice.confirmations,
        paid_at: invoice.paidAt?.toISOString() || null,
      },
      metadata: invoice.metadata || {},
    };

    const payloadString = JSON.stringify(payload);
    const secret =
      merchant.webhookSecret || process.env.WEBHOOK_SECRET || "default_secret";
    const signature = Derivator.signWebhookPayload(payloadString, secret);

    try {
      console.log(
        `📡 Dispatching ${event} to ${merchant.webhookUrl} (Attempt ${invoice.webhookAttempts + 1})`,
      );

      const response = await fetch(merchant.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-knot-signature": signature,
          "x-knot-event": event,
          "x-knot-invoice": invoice.invoiceId,
          "User-Agent": "KnotEngine-Webhook-Dispatcher/1.0",
        },
        body: payloadString,
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      if (response.ok) {
        const updateSet: Record<string, unknown> = {
          webhookAttempts: (invoice.webhookAttempts || 0) + 1,
          lastWebhookAttempt: new Date(),
        };

        if (event === "invoice.confirmed" || event === "invoice.failed") {
          updateSet.webhookDelivered = true;
        }

        await Invoice.findByIdAndUpdate(invoice._id, {
          $set: updateSet,
        });
        console.log(
          `✅ Webhook SUCCESS: ${invoiceId} ${event} delivered to merchant.`,
        );
        return true;
      } else {
        throw new Error(`Merchant returned ${response.status}`);
      }
    } catch (error: unknown) {
      const attempts = (invoice.webhookAttempts || 0) + 1;

      // Update attempts in DB regardless of failure
      await Invoice.findByIdAndUpdate(invoice._id, {
        $set: {
          webhookAttempts: attempts,
          lastWebhookAttempt: new Date(),
        },
      });

      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `❌ Webhook FAILURE (${attempts}/${this.MAX_ATTEMPTS}) for ${invoiceId}: ${message}`,
      );

      // Notify Merchant only on the first failure to avoid spamming 10+ identical alerts
      const isTestnet = invoice.metadata?.isTestnet === true;
      if (attempts === 1) {
        NotificationService.create({
          merchantId: invoice.merchantId.toString(),
          title: isTestnet
            ? "[TEST] Webhook Delivery Failed"
            : "Webhook Delivery Failed",
          description: `Failed to notify your server for invoice ${invoice.invoiceId}: ${message}`,
          type: "error",
          link: "/dashboard/webhooks",
          meta: { invoiceId: invoice.invoiceId, error: message, isTestnet },
        });
      }

      // We don't use setTimeout here anymore for production reliability.
      // Instead, we rely on the background 'dispatchPending' job to pick it up
      // based on the 'lastWebhookAttempt' and 'webhookAttempts' count.

      return false;
    }
  }

  /**
   * Dispatches a test webhook notification to the merchant with dummy data.
   */
  public static async dispatchTest(merchantId: string): Promise<boolean> {
    const merchant = await Merchant.findById(merchantId);

    if (!merchant?.webhookUrl) {
      throw new Error("No webhook URL configured");
    }

    const event = "invoice.confirmed";
    const payload = {
      id: `evt_test_${crypto.randomBytes(8).toString("hex")}`,
      event,
      created: Math.floor(Date.now() / 1000),
      invoice_id: "inv_test_1234567890",
      status: "confirmed",
      amount: {
        usd: 100.0,
        crypto: 0.0015,
        currency: "BTC",
        fee_usd: 1.0,
      },
      payment: {
        address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        tx_hash:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        confirmations: 2,
        paid_at: new Date().toISOString(),
      },
      metadata: { is_test: true },
    };

    const payloadString = JSON.stringify(payload);
    const secret =
      merchant.webhookSecret || process.env.WEBHOOK_SECRET || "default_secret";
    const signature = Derivator.signWebhookPayload(payloadString, secret);

    try {
      console.log(`📡 Dispatching TEST webhook to ${merchant.webhookUrl}`);

      const response = await fetch(merchant.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-knot-signature": signature,
          "x-knot-event": event,
          "x-knot-invoice": payload.invoice_id,
          "User-Agent": "KnotEngine-Webhook-Dispatcher/1.0",
        },
        body: payloadString,
        signal: AbortSignal.timeout(10000), // 10 second timeout for tests
      });

      if (!response.ok) {
        throw new Error(`Merchant returned ${response.status}`);
      }

      console.log(`✅ TEST Webhook SUCCESS`);
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ TEST Webhook FAILURE: ${message}`);
      throw error;
    }
  }

  /**
   * Catch-up mechanism: finds all invoices that failed delivery and retries them
   * using an exponential backoff strategy based on the last attempt time.
   */
  public static async dispatchPending(): Promise<number> {
    const now = new Date();

    // Find missing deliveries
    const candidates = await Invoice.find({
      webhookDelivered: false,
      webhookAttempts: { $lt: this.MAX_ATTEMPTS },
      status: { $in: ["confirmed", "expired"] },
    });

    let dispatched = 0;

    for (const invoice of candidates) {
      const attempts = invoice.webhookAttempts || 0;

      // If never attempted, dispatch immediately
      if (attempts === 0) {
        await this.triggerInvoiceWebhook(invoice);
        dispatched++;
        continue;
      }

      // Calculate next allowed retry time (Exponential: 2, 4, 8, 16... minutes)
      const lastAttempt = invoice.lastWebhookAttempt
        ? new Date(invoice.lastWebhookAttempt).getTime()
        : 0;
      const waitMinutes = Math.pow(2, attempts) * this.INITIAL_BACKOFF_MINUTES;
      const nextAllowedAttempt = lastAttempt + waitMinutes * 60 * 1000;

      if (now.getTime() >= nextAllowedAttempt) {
        await this.triggerInvoiceWebhook(invoice);
        dispatched++;
      }
    }

    return dispatched;
  }

  private static async triggerInvoiceWebhook(invoice: IInvoice) {
    const event =
      invoice.status === "confirmed" ? "invoice.confirmed" : "invoice.failed";
    await this.dispatch(invoice.invoiceId, event);
  }
}
