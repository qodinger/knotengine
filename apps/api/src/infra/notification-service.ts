import { Notification } from "@knotengine/database";
import { SocketService } from "./socket-service";

/**
 * 🔔 Notification Service
 *
 * Handles creation and real-time delivery of notifications to merchants.
 */
export class NotificationService {
  /**
   * Creates a notification in the database and emits it via Socket.io.
   */
  public static async create(params: {
    merchantId: string;
    title: string;
    description: string;
    type: "success" | "warning" | "error" | "info";
    link?: string;
    meta?: Record<string, any>;
  }) {
    try {
      // 1. Persist to Database
      const notification = await Notification.create({
        merchantId: params.merchantId,
        title: params.title,
        description: params.description,
        type: params.type,
        link: params.link,
        meta: params.meta,
      });

      // 2. Emit Real-time Socket Event
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
      // We don't throw here to avoid breaking the calling flow (e.g. payment processing)
      return null;
    }
  }

  /**
   * Helper for Low Credit alerts
   */
  public static async notifyLowBalance(merchantId: string, balance: number) {
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
  ) {
    return this.create({
      merchantId,
      title: "Payment Received",
      description: `Invoice ${invoiceId} has been fully confirmed ($${amountUsd.toFixed(2)}).`,
      type: "success",
      link: `/dashboard/payments`, // Replace with actual payments page if needed
      meta: { invoiceId },
    });
  }

  /**
   * Helper for Webhook Failure
   */
  public static async notifyWebhookFailed(
    merchantId: string,
    invoiceId: string,
    error: string,
  ) {
    return this.create({
      merchantId,
      title: "Webhook Delivery Failed",
      description: `Failed to notify your server for invoice ${invoiceId}: ${error}`,
      type: "error",
      link: "/dashboard/webhooks",
      meta: { invoiceId, error },
    });
  }
}
