import { Notification } from "@qodinger/knot-database";
import { SocketService } from "./socket-service.js";

/**
 * 🔔 Notification Service
 *
 * Handles creation and real-time delivery of notifications to merchants.
 */
export class NotificationService {
  public static async create(params: {
    merchantId: string;
    title: string;
    description: string;
    type: "success" | "warning" | "error" | "info";
    link?: string;
    meta?: Record<string, any>;
  }) {
    try {
      // 1. Deduplication Logic:
      // If there's an unread notification for the same invoice and same major title/topic,
      // update it instead of creating a new one. This prevents "Confirmation Spam".
      if (params.meta?.invoiceId) {
        // Extract base title and escape special characters for Regex (like '[' and ']')
        const baseTitle = params.title.split(" (")[0];
        const escapedTitle = baseTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        const existing = await Notification.findOne({
          merchantId: params.merchantId,
          "meta.invoiceId": params.meta.invoiceId,
          title: { $regex: new RegExp(`^${escapedTitle}`) },
          isRead: false,
        });

        if (existing) {
          existing.title = params.title;
          existing.description = params.description;
          existing.type = params.type;
          existing.meta = params.meta;
          // We don't change createdAt because we want to preserve the first detection time,
          // but we save to update the updatedAt which handles sorting in some UI.
          await existing.save();

          // Re-emit update via socket
          SocketService.emitToMerchant(
            params.merchantId,
            "notification_updated",
            {
              id: existing._id,
              title: existing.title,
              description: existing.description,
              type: existing.type,
              link: existing.link,
              isRead: existing.isRead,
              updatedAt: existing.updatedAt,
            },
          );

          return existing;
        }
      }

      // 2. Persist to Database (New)
      const notification = await Notification.create({
        merchantId: params.merchantId,
        title: params.title,
        description: params.description,
        type: params.type,
        link: params.link,
        meta: params.meta,
      });

      // 3. Emit Real-time Socket Event
      SocketService.emitToMerchant(params.merchantId, "notification", {
        id: notification._id,
        title: notification.title,
        description: notification.description,
        type: notification.type,
        link: notification.link,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      });

      return notification;
    } catch (err) {
      console.error("❌ Failed to create notification:", err);
      return null;
    }
  }

  /**
   * Helper for Low Credit alerts
   */
  public static async notifyLowBalance(merchantId: string, balance: number) {
    // Avoid spamming: Check if there's already an unread Low Balance notification
    const existing = await Notification.findOne({
      merchantId,
      title: "Low Credit Balance",
      isRead: false,
    });

    if (existing) return null;

    return this.create({
      merchantId,
      title: "Low Credit Balance",
      description: `Your balance is $${balance.toFixed(2)}. Top up soon to avoid service interruption.`,
      type: "warning",
      link: "/dashboard/billing",
    });
  }

  /**
   * Helper for Invoice Confirmed
   */
  public static async notifyPaymentConfirmed(
    merchantId: string,
    invoiceId: string,
    amountUsd: number,
    isTestnet: boolean = false,
  ) {
    const title = isTestnet ? "[TEST] Payment Received" : "Payment Received";
    return this.create({
      merchantId,
      title,
      description: `Invoice ${invoiceId} has been fully confirmed ($${amountUsd.toFixed(2)}).`,
      type: "success",
      link: `/dashboard/payments`,
      meta: { invoiceId, isTestnet },
    });
  }

  /**
   * Helper for Partial Payment detected
   */
  public static async notifyPartialPayment(
    merchantId: string,
    invoiceId: string,
    received: string,
    totalReceived: string,
    expected: string,
    asset: string,
    status?: string,
    isTestnet: boolean = false,
  ) {
    const stage =
      status === "mempool_detected"
        ? "Mempool"
        : status === "confirming"
          ? "Confirming"
          : status === "partially_paid" || status === "confirmed"
            ? "Pending"
            : "";

    let title = stage
      ? `⚠️ Partial Payment Detected (${stage})`
      : "⚠️ Partial Payment Detected";

    if (isTestnet) title = `[TEST] ${title}`;

    const formattedTotal = parseFloat(
      parseFloat(totalReceived).toFixed(8),
    ).toString();
    const desc =
      parseFloat(totalReceived) > parseFloat(received)
        ? `Detected another ${received} ${asset}. Total received: ${formattedTotal} / ${expected} ${asset}.`
        : `Received ${received} ${asset} which is less than the required ${expected} ${asset}.`;

    return this.create({
      merchantId,
      title,
      description: desc,
      type: "warning",
      link: `/dashboard/payments`,
      meta: { invoiceId, received, totalReceived, expected, asset, isTestnet },
    });
  }

  /**
   * Helper for Overpayment detected
   */
  public static async notifyOverpayment(
    merchantId: string,
    invoiceId: string,
    received: string,
    totalReceived: string,
    expected: string,
    asset: string,
    status?: string,
    isTestnet: boolean = false,
  ) {
    const stage =
      status === "mempool_detected"
        ? "Mempool"
        : status === "confirming"
          ? "Confirming"
          : status === "overpaid" || status === "confirmed"
            ? "Settled"
            : "";

    let title = stage
      ? `💰 Overpayment Detected (${stage})`
      : "💰 Overpayment Detected";

    if (isTestnet) title = `[TEST] ${title}`;

    const formattedTotal = parseFloat(
      parseFloat(totalReceived).toFixed(8),
    ).toString();
    const desc =
      parseFloat(totalReceived) > parseFloat(received)
        ? `Detected another ${received} ${asset}. Total received: ${formattedTotal} (Target: ${expected} ${asset}).`
        : `Received ${received} ${asset} which is significantly more than the required ${expected} ${asset}.`;

    return this.create({
      merchantId,
      title,
      description: desc,
      type: "success",
      link: `/dashboard/payments`,
      meta: { invoiceId, received, totalReceived, expected, asset, isTestnet },
    });
  }

  /**
   * Helper for Webhook Failure
   */
  public static async notifyWebhookFailed(
    merchantId: string,
    invoiceId: string,
    error: string,
    isTestnet: boolean = false,
  ) {
    let title = "Webhook Delivery Failed";
    if (isTestnet) title = `[TEST] ${title}`;

    return this.create({
      merchantId,
      title,
      description: `Failed to notify your server for invoice ${invoiceId}: ${error}`,
      type: "error",
      link: "/dashboard/webhooks",
      meta: { invoiceId, error, isTestnet },
    });
  }
}
