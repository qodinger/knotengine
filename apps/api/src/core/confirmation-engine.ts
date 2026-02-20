import {
  Invoice,
  IInvoice,
  Merchant,
  WebhookEvent,
} from "@knotengine/database";
import { SocketService } from "../infra/socket-service";
import { WebhookDispatcher } from "../infra/webhook-dispatcher";
import { TatumProvider } from "../infra/tatum-provider";
import { DEFAULT_CONFIRMATIONS, EVM_CURRENCIES } from "@knotengine/types";
import { NotificationService } from "../infra/notification-service";

/**
 * 🔒 ConfirmationEngine
 *
 * Handles the core confirmation logic for the Knot Engine.
 * Implements configurable block-depth checks per currency,
 * respecting merchant-level overrides.
 */
export class ConfirmationEngine {
  /**
   * Processes a new blockchain event and updates the invoice state.
   * This is the heart of the payment confirmation pipeline.
   *
   * State Machine:
   *   pending → mempool_detected → confirming → confirmed
   *   pending → expired (via TTL check)
   */
  public static async processBlockchainEvent(event: {
    toAddress: string;
    txHash: string;
    blockNumber: number;
    confirmations: number;
    amount: string;
    asset: string;
    source: string;
    invoiceId?: string;
    rawPayload: Record<string, unknown>;
  }): Promise<{
    matched: boolean;
    invoiceId?: string;
    newStatus?: string;
  }> {
    // 1. Find the matching invoice
    // Priority: invoiceId (Simulation) > payAddress Exact > payAddress Case-Insensitive (EVM)
    let invoice: IInvoice | null = null;
    const statusFilter = {
      $in: ["pending", "mempool_detected", "confirming"],
    };

    if (event.invoiceId) {
      invoice = await Invoice.findOne({
        invoiceId: event.invoiceId,
        status: statusFilter,
      });
    }

    if (!invoice) {
      // Try strict match
      invoice = await Invoice.findOne({
        payAddress: event.toAddress,
        status: statusFilter,
      });
    }

    if (!invoice) {
      // Try case-insensitive match (Important for EVM checksum addresses)
      // We use a regex for this.
      const candidate = await Invoice.findOne({
        payAddress: { $regex: new RegExp(`^${event.toAddress}$`, "i") },
        status: statusFilter,
      });

      // Validation: If we matched loosely, ensure it's safe (EVM) or verify strictness (BTC)
      if (candidate) {
        const isEVM = (EVM_CURRENCIES as string[]).includes(
          candidate.cryptoCurrency,
        );
        // If it's EVM, case doesn't matter (0xAbC == 0xabc).
        // If it's BTC/LTC, case MATTERS (Base58), so we must reject if not exact.
        if (isEVM || candidate.payAddress === event.toAddress) {
          invoice = candidate;
        }
      }
    }

    if (!invoice) {
      // Log the event anyway for audit
      await WebhookEvent.create({
        ...event,
        eventType: "unmatched_tx",
        processed: false,
        rawPayload: event.rawPayload,
      });
      return { matched: false };
    }

    // 2. Record the webhook event
    await WebhookEvent.create({
      source: event.source,
      eventType: "address_activity",
      toAddress: event.toAddress,
      txHash: event.txHash,
      amount: event.amount,
      asset: event.asset,
      blockNumber: event.blockNumber,
      confirmations: event.confirmations,
      processed: true,
      invoiceId: invoice._id,
      rawPayload: event.rawPayload,
    });

    // 3. Determine new status based on confirmation depth
    const newStatus = this.determineStatus(invoice, event.confirmations);

    // 4. Update the invoice
    const updateData: Partial<Record<string, unknown>> = {
      txHash: event.txHash,
      confirmations: event.confirmations,
      status: newStatus,
    };

    if (event.blockNumber > 0) {
      updateData.blockNumber = event.blockNumber;
    }

    if (newStatus === "confirmed" && !invoice.paidAt) {
      updateData.paidAt = new Date();
    }

    await Invoice.findByIdAndUpdate(invoice._id, { $set: updateData });

    // 5. Emit real-time update
    SocketService.emitStatusUpdate(invoice.invoiceId, newStatus, {
      confirmations: event.confirmations,
      requiredConfirmations: invoice.requiredConfirmations,
      txHash: event.txHash,
    });

    if (newStatus === "mempool_detected" && invoice.status === "pending") {
      WebhookDispatcher.dispatch(invoice.invoiceId, "invoice.mempool_detected");

      // Notify Merchant
      NotificationService.create({
        merchantId: invoice.merchantId.toString(),
        title: "New Transaction",
        description: `Detected ${event.amount} ${event.asset} for invoice ${invoice.invoiceId} (mempool).`,
        type: "info",
        link: `/dashboard/payments`,
        meta: { invoiceId: invoice.invoiceId, txHash: event.txHash },
      });
    }

    // 6. Trigger outbound webhook if confirmed
    if (newStatus === "confirmed") {
      WebhookDispatcher.dispatch(invoice.invoiceId, "invoice.confirmed");

      // 7. Cleanup Tatum monitoring
      if (invoice.tatumSubscriptionId) {
        TatumProvider.deleteSubscription(invoice.tatumSubscriptionId);
      }

      // 8. Deduct from Credit Balance & Accrue Fees (KnotEngine Fee)
      if (!invoice.paidAt) {
        await Merchant.findByIdAndUpdate(invoice.merchantId, {
          $inc: {
            "feesAccrued.usd": invoice.feeUsd,
            [`feesAccrued.${invoice.cryptoCurrency}`]: invoice.feeCrypto,
            creditBalance: -invoice.feeUsd, // Deduct from prepaid credits
          },
        });

        // Notify Merchant
        NotificationService.notifyPaymentConfirmed(
          invoice.merchantId.toString(),
          invoice.invoiceId,
          invoice.amountUsd,
        );

        // Check if credit balance is getting low
        const updatedMerchant = await Merchant.findById(invoice.merchantId);
        if (updatedMerchant && updatedMerchant.creditBalance < 3.0) {
          NotificationService.notifyLowBalance(
            invoice.merchantId.toString(),
            updatedMerchant.creditBalance,
          );
        }
      }
    }

    console.log(
      `📦 Invoice ${invoice.invoiceId}: ${invoice.status} → ${newStatus} (${event.confirmations}/${invoice.requiredConfirmations} confirmations)`,
    );

    return {
      matched: true,
      invoiceId: invoice.invoiceId,
      newStatus,
    };
  }

  /**
   * Determines the invoice status based on current confirmation count.
   */
  private static determineStatus(
    invoice: IInvoice,
    confirmations: number,
  ): string {
    if (confirmations <= 0) {
      return "mempool_detected";
    }

    if (confirmations >= invoice.requiredConfirmations) {
      return "confirmed";
    }

    return "confirming";
  }

  /**
   * Gets the required confirmation count for a currency,
   * optionally overridden by merchant-level policy.
   */
  public static async getRequiredConfirmations(
    merchantId: string,
    currency: string,
  ): Promise<number> {
    const merchant = await Merchant.findById(merchantId);

    if (merchant?.confirmationPolicy) {
      const policy = merchant.confirmationPolicy as Record<string, number>;
      const key = currency.split("_")[0]; // BTC, LTC, ETH
      if (policy[key] !== undefined) {
        return policy[key];
      }
    }

    return DEFAULT_CONFIRMATIONS[currency] || 6;
  }

  /**
   * Expires old invoices that have passed their TTL.
   * Should be called periodically (e.g., every 60 seconds).
   */
  public static async expireStaleInvoices(): Promise<number> {
    const staleInvoices = await Invoice.find({
      status: { $in: ["pending", "mempool_detected", "confirming"] },
      expiresAt: { $lt: new Date() },
    });

    if (staleInvoices.length === 0) return 0;

    for (const invoice of staleInvoices) {
      await Invoice.findByIdAndUpdate(invoice._id, {
        $set: { status: "expired" },
      });

      // Cleanup Tatum monitoring
      if (invoice.tatumSubscriptionId) {
        TatumProvider.deleteSubscription(invoice.tatumSubscriptionId);
      }

      NotificationService.create({
        merchantId: invoice.merchantId.toString(),
        title: "Invoice Expired",
        description: `Invoice ${invoice.invoiceId} has expired without receiving payment.`,
        type: "error",
        link: "/dashboard/payments",
        meta: { invoiceId: invoice.invoiceId },
      });

      console.log(`⏰ Invoice ${invoice.invoiceId} expired.`);
    }

    return staleInvoices.length;
  }
}
