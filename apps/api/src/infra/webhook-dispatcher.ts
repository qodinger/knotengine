import { Invoice, IInvoice, Merchant } from "@tyepay/database";
import { Derivator } from "@tyepay/crypto";
import * as crypto from "crypto";

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

    const payload = {
      id: `evt_${crypto.randomBytes(12).toString("hex")}`,
      event,
      created: Math.floor(Date.now() / 1000),
      invoice_id: invoice.invoiceId,
      status: invoice.status,
      amount: {
        usd: invoice.amountUsd,
        crypto: invoice.cryptoAmount,
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
          "X-TyePay-Signature": signature,
          "X-TyePay-Event": event,
          "X-TyePay-Invoice": invoice.invoiceId,
          "User-Agent": "TyePay-Webhook-Dispatcher/1.0",
        },
        body: payloadString,
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      if (response.ok) {
        await Invoice.findByIdAndUpdate(invoice._id, {
          $set: {
            webhookDelivered: true,
            webhookAttempts: (invoice.webhookAttempts || 0) + 1,
            lastWebhookAttempt: new Date(),
          },
        });
        console.log(`✅ Webhook SUCCESS: ${invoiceId} confirmed by merchant.`);
        return true;
      } else {
        throw new Error(`Merchant returned ${response.status}`);
      }
    } catch (error: any) {
      const attempts = (invoice.webhookAttempts || 0) + 1;

      // Update attempts in DB regardless of failure
      await Invoice.findByIdAndUpdate(invoice._id, {
        $set: {
          webhookAttempts: attempts,
          lastWebhookAttempt: new Date(),
        },
      });

      console.error(
        `❌ Webhook FAILURE (${attempts}/${this.MAX_ATTEMPTS}) for ${invoiceId}: ${error.message}`,
      );

      // We don't use setTimeout here anymore for production reliability.
      // Instead, we rely on the background 'dispatchPending' job to pick it up
      // based on the 'lastWebhookAttempt' and 'webhookAttempts' count.

      return false;
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
      invoice.status === "confirmed" ? "invoice.confirmed" : "invoice.expired";
    await this.dispatch(invoice.invoiceId, event);
  }
}
