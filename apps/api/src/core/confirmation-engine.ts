import {
  Invoice,
  IInvoice,
  InvoiceStatus,
  Merchant,
  WebhookEvent,
  User,
} from "@qodinger/knot-database";
import { SocketService } from "../infra/socket-service";
import { WebhookDispatcher } from "../infra/webhook-dispatcher";
import { DEFAULT_CONFIRMATIONS, EVM_CURRENCIES } from "@qodinger/knot-types";
import { BlockchainProviderPool } from "../infra/provider-pool";
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
    try {
      // 1. Find the matching invoice
      // Priority: invoiceId (Simulation) > payAddress Exact > payAddress Case-Insensitive (EVM)
      let invoice: IInvoice | null = null;
      const statusFilter = {
        $in: [
          "pending",
          "mempool_detected",
          "confirming",
          "partially_paid",
          "overpaid",
        ],
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
        const candidate = await Invoice.findOne({
          payAddress: { $regex: new RegExp(`^${event.toAddress}$`, "i") },
          status: statusFilter,
        });

        if (candidate) {
          const isEVM = (EVM_CURRENCIES as string[]).includes(
            candidate.cryptoCurrency,
          );
          if (isEVM || candidate.payAddress === event.toAddress) {
            invoice = candidate;
          }
        }
      }

      if (!invoice) {
        await WebhookEvent.create({
          ...event,
          eventType: "unmatched_tx",
          processed: false,
          rawPayload: event.rawPayload,
        });
        return { matched: false };
      }

      // 1.5. Validate Asset
      const merchant = await Merchant.findById(invoice.merchantId);
      if (!merchant) return { matched: false };

      // Asset validation: Must match exactly
      const isAssetMatch =
        event.asset === invoice.cryptoCurrency ||
        (invoice.cryptoCurrency.startsWith(event.asset) &&
          ["USDT_ERC20", "USDT_POLYGON"].includes(invoice.cryptoCurrency));

      if (!isAssetMatch) {
        console.warn(
          `⚠️  Asset mismatch for ${invoice.invoiceId}: Received ${event.asset}, Expected ${invoice.cryptoCurrency}`,
        );
        return { matched: false };
      }

      // 2. Record the webhook event (Idempotency check)
      const existingEvent = await WebhookEvent.findOne({
        txHash: event.txHash,
        invoiceId: invoice._id,
      });
      if (!existingEvent) {
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
      } else {
        // Update confirmation count for existing event
        await WebhookEvent.findByIdAndUpdate(existingEvent._id, {
          confirmations: event.confirmations,
          blockNumber: event.blockNumber,
        });
      }

      // 3. Calculate Cumulative Received Amount
      const allEvents = await WebhookEvent.find({
        invoiceId: invoice._id,
        processed: true,
      });
      const totalCryptoReceived = parseFloat(
        allEvents.reduce((sum, e) => sum + parseFloat(e.amount), 0).toFixed(8),
      );

      const tolerance = merchant.underpaymentTolerancePercentage ?? 1;
      const minRequired = invoice.cryptoAmount * (1 - tolerance / 100);
      const isOverpayment = totalCryptoReceived > invoice.cryptoAmount * 1.05;

      // Determine amount status
      let amountStatus: InvoiceStatus = "confirming";
      if (totalCryptoReceived < minRequired) {
        amountStatus = "partially_paid";
      } else if (isOverpayment) {
        amountStatus = "overpaid";
      }

      // 4. Determine new status based on confirmation depth AND amount
      let newStatus = this.determineStatus(invoice, event.confirmations);

      // If the amount is wrong, override the depth-based status with the amount status.
      // Partial payments must remain 'partially_paid' even if heavily confirmed.
      if (amountStatus === "partially_paid") {
        newStatus = "partially_paid";
      } else if (amountStatus === "overpaid") {
        // Overpaid should also count as confirmed for the customer's perspective
        // but we keep the internal label 'overpaid' for merchant awareness.
        if (newStatus === "confirmed") {
          newStatus = "overpaid";
        }
      }

      // A state is 'terminal_success' if it's confirmed or overpaid.
      const isTerminalSuccess =
        newStatus === "confirmed" || newStatus === "overpaid";

      // 4. Update the invoice
      const updateData: Partial<Record<string, unknown>> = {
        txHash: event.txHash,
        confirmations: event.confirmations,
        status: newStatus,
        cryptoAmountReceived: totalCryptoReceived, // Cumulative amount received
      };

      if (event.blockNumber > 0) {
        updateData.blockNumber = event.blockNumber;
      }

      if (isTerminalSuccess && !invoice.paidAt) {
        updateData.paidAt = new Date();
      }

      await Invoice.findByIdAndUpdate(invoice._id, { $set: updateData });

      // 5. Emit real-time update
      SocketService.emitStatusUpdate(invoice.invoiceId, newStatus, {
        confirmations: event.confirmations,
        requiredConfirmations: invoice.requiredConfirmations,
        txHash: event.txHash,
        cryptoAmountReceived: totalCryptoReceived,
      });

      const isTestnet = invoice.metadata?.isTestnet === true;
      const isNewTransaction = !existingEvent;
      const statusChanged = invoice.status !== newStatus;

      // 5.1 Dispatch webhooks (Only on state change or new TX to avoid spamming merchant server)
      if (isNewTransaction || statusChanged) {
        const webhookEvent = isTerminalSuccess
          ? "invoice.confirmed"
          : `invoice.${newStatus}`;
        WebhookDispatcher.dispatch(invoice.invoiceId, webhookEvent as any);
      }

      // 5.2 Notify Merchant (The NotificationService handles internal deduplication/updating)
      if (amountStatus === "partially_paid") {
        NotificationService.notifyPartialPayment(
          invoice.merchantId.toString(),
          invoice.invoiceId,
          event.amount,
          totalCryptoReceived.toString(),
          invoice.cryptoAmount.toString(),
          event.asset,
          newStatus,
          isTestnet,
        );
      } else if (amountStatus === "overpaid") {
        NotificationService.notifyOverpayment(
          invoice.merchantId.toString(),
          invoice.invoiceId,
          event.amount,
          totalCryptoReceived.toString(),
          invoice.cryptoAmount.toString(),
          event.asset,
          newStatus,
          isTestnet,
        );
      } else {
        const stage =
          newStatus === "mempool_detected"
            ? "mempool"
            : newStatus === "confirming"
              ? "confirming"
              : "confirmed";

        NotificationService.create({
          merchantId: invoice.merchantId.toString(),
          title: isTestnet ? "[TEST] New Transaction" : "New Transaction",
          description: `Detected ${event.amount} ${event.asset} for invoice ${invoice.invoiceId} (${stage}).`,
          type: "info",
          link: `/dashboard/payments`,
          meta: {
            invoiceId: invoice.invoiceId,
            txHash: event.txHash,
            isTestnet,
          },
        });
      }

      // 6. Trigger outbound webhook if terminal success
      if (isTerminalSuccess) {
        // Dispatch additional standard webhook if status just became confirmed/overpaid
        if (statusChanged) {
          WebhookDispatcher.dispatch(invoice.invoiceId, "invoice.confirmed");
        }

        // 7. Cleanup Tatum monitoring
        if (invoice.tatumSubscriptionId && invoice.providerName) {
          BlockchainProviderPool.getInstance().deleteSubscription(
            invoice.providerName,
            invoice.tatumSubscriptionId,
          );
        }

        // 8. Deduct from Credit Balance & Accrue Fees (KnotEngine Fee)
        // Skip for testnet invoices
        if (!invoice.paidAt && !isTestnet) {
          // A. Accrue Merchant-level fees (for reporting)
          await Merchant.findByIdAndUpdate(invoice.merchantId, {
            $inc: {
              "feesAccrued.usd": invoice.feeUsd,
              [`feesAccrued.${invoice.cryptoCurrency}`]: invoice.feeCrypto,
            },
          });

          // B. Deduct from User-level shared credit balance
          if (merchant.userId) {
            await User.findByIdAndUpdate(merchant.userId, {
              $inc: { creditBalance: -invoice.feeUsd },
            });
          }

          // Notify Merchant
          NotificationService.notifyPaymentConfirmed(
            invoice.merchantId.toString(),
            invoice.invoiceId,
            invoice.amountUsd,
            isTestnet,
          );

          // Check if user credit balance is getting low
          const user = merchant.userId
            ? await User.findById(merchant.userId)
            : null;
          if (user && user.creditBalance < 3.0) {
            NotificationService.notifyLowBalance(
              invoice.merchantId.toString(),
              user.creditBalance,
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
    } catch (err) {
      console.error("❌ ConfirmationEngine Error:", err);
      return { matched: false };
    }
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
      status: {
        $in: ["pending", "mempool_detected", "confirming", "partially_paid"],
      },
      expiresAt: { $lt: new Date() },
    });

    if (staleInvoices.length === 0) return 0;

    for (const invoice of staleInvoices) {
      const prevStatus = invoice.status;
      await Invoice.findByIdAndUpdate(invoice._id, {
        $set: { status: "expired" },
      });

      // 1. Emit real-time socket update
      SocketService.emitStatusUpdate(invoice.invoiceId, "expired", {
        txHash: invoice.txHash,
        confirmations: invoice.confirmations,
      });

      // 2. Dispatch Webhook
      WebhookDispatcher.dispatch(invoice.invoiceId, "invoice.expired");

      // 3. Cleanup monitoring
      if (invoice.tatumSubscriptionId && invoice.providerName) {
        BlockchainProviderPool.getInstance().deleteSubscription(
          invoice.providerName,
          invoice.tatumSubscriptionId,
        );
      }

      // 4. Notify Merchant if funds were involved
      if (prevStatus !== "pending") {
        const isTestnet = invoice.metadata?.isTestnet === true;
        NotificationService.create({
          merchantId: invoice.merchantId.toString(),
          title: isTestnet ? "[TEST] Invoice Expired" : "Invoice Expired",
          description: `Invoice ${invoice.invoiceId} has expired after receiving partial or unconfirmed funds.`,
          type: "error",
          link: "/dashboard/payments",
          meta: { invoiceId: invoice.invoiceId, isTestnet },
        });
      }

      console.log(`⏰ Invoice ${invoice.invoiceId} expired.`);
    }

    return staleInvoices.length;
  }
}
