import nodemailer from "nodemailer";
import { EmailTemplates } from "../core/email-templates.js";

/**
 * 📧 Email Service
 *
 * Handles sending transactional emails via Gmail SMTP.
 * Supports payment alerts, security notifications, and billing emails.
 *
 * Gmail Setup:
 * 1. Go to https://myaccount.google.com/apppasswords
 * 2. Create app password for "Mail"
 * 3. Add to .env:
 *    GMAIL_USER=your-email@gmail.com
 *    GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
 */

export class EmailService {
  private static _transporter: nodemailer.Transporter | null = null;

  /**
   * Lazy-load transporter (ensures env vars are loaded first)
   */
  private static getTransporter(): nodemailer.Transporter | null {
    if (!EmailService._transporter) {
      const smtpHost = process.env.GMAIL_SMTP_HOST || "smtp.gmail.com";
      const smtpPort = parseInt(process.env.GMAIL_SMTP_PORT || "587");
      const smtpUser = process.env.GMAIL_USER || "";
      const smtpPass = process.env.GMAIL_APP_PASSWORD || "";

      if (!smtpUser || !smtpPass) {
        console.warn(
          "⚠️ Gmail credentials not configured. Email sending disabled.",
        );
        console.warn(`GMAIL_USER: ${smtpUser ? "SET" : "NOT SET"}`);
        console.warn(`GMAIL_APP_PASSWORD: ${smtpPass ? "SET" : "NOT SET"}`);
        return null;
      }

      EmailService._transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }

    return EmailService._transporter;
  }

  /**
   * Send payment notification email
   */
  static async sendPaymentAlert(params: {
    to: string;
    merchantName: string;
    invoiceId: string;
    amount: string;
    currency: string;
    status: "received" | "confirmed" | "expired" | "overpaid";
    checkoutUrl?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const transporter = this.getTransporter();

    if (!transporter) {
      console.warn("⚠️ Email service not configured. Skipping email.");
      return { success: false, error: "Email service not configured" };
    }

    const template = EmailTemplates.getPaymentNotificationHtml(params);

    try {
      const info = await transporter.sendMail({
        from: process.env.FROM_EMAIL || "KnotEngine <noreply@knotengine.com>",
        to: params.to,
        subject: `Payment ${params.status === "received" ? "Received" : params.status === "confirmed" ? "Confirmed" : params.status === "overpaid" ? "Overpaid" : "Expired"} - ${params.amount} ${params.currency}`,
        html: template,
      });

      console.log(`✅ Payment email sent to ${params.to} (${info.messageId})`);
      return { success: true };
    } catch (err) {
      console.error("❌ Email service error:", err);
      return { success: false, error: "Failed to send email" };
    }
  }

  /**
   * Send security notification email
   */
  static async sendSecurityAlert(params: {
    to: string;
    merchantName: string;
    action: string;
    description: string;
    ipAddress?: string;
    timestamp: string;
  }): Promise<{ success: boolean; error?: string }> {
    const transporter = this.getTransporter();

    if (!transporter) {
      console.warn("⚠️ Email service not configured. Skipping email.");
      return { success: false, error: "Email service not configured" };
    }

    const template = EmailTemplates.getSecurityAlertHtml(params);

    try {
      const info = await transporter.sendMail({
        from: process.env.FROM_EMAIL || "KnotEngine <noreply@knotengine.com>",
        to: params.to,
        subject: `Security Alert: ${params.action}`,
        html: template,
      });

      console.log(`✅ Security email sent to ${params.to} (${info.messageId})`);
      return { success: true };
    } catch (err) {
      console.error("❌ Email service error:", err);
      return { success: false, error: "Failed to send email" };
    }
  }

  /**
   * Send billing notification email
   */
  static async sendBillingNotification(params: {
    to: string;
    merchantName: string;
    type:
      | "subscription_charged"
      | "payment_received"
      | "low_balance"
      | "plan_changed";
    amount?: string;
    plan?: string;
    description: string;
  }): Promise<{ success: boolean; error?: string }> {
    const transporter = this.getTransporter();

    if (!transporter) {
      console.warn("⚠️ Email service not configured. Skipping email.");
      return { success: false, error: "Email service not configured" };
    }

    const template = EmailTemplates.getBillingNotificationHtml(params);

    try {
      const info = await transporter.sendMail({
        from: process.env.FROM_EMAIL || "KnotEngine <noreply@knotengine.com>",
        to: params.to,
        subject: `Billing Notification: ${params.type.replace("_", " ")}`,
        html: template,
      });

      console.log(`✅ Billing email sent to ${params.to} (${info.messageId})`);
      return { success: true };
    } catch (err) {
      console.error("❌ Email service error:", err);
      return { success: false, error: "Failed to send email" };
    }
  }

  /**
   * Test email connectivity
   */
  static async testConnection(): Promise<boolean> {
    const transporter = this.getTransporter();

    if (!transporter) {
      return false;
    }

    try {
      await transporter.verify();
      console.log("✅ Gmail SMTP connection successful");
      return true;
    } catch (err) {
      console.error("❌ Gmail SMTP connection failed:", err);
      return false;
    }
  }

  /**
   * Send magic link login email
   */
  static async sendMagicLink(params: {
    to: string;
    magicLink: string;
  }): Promise<{ success: boolean; error?: string }> {
    const transporter = this.getTransporter();

    if (!transporter) {
      console.warn("⚠️ Email service not configured. Skipping email.");
      return { success: false, error: "Email service not configured" };
    }

    const template = EmailTemplates.getMagicLinkHtml(params.magicLink);

    try {
      const info = await transporter.sendMail({
        from: process.env.FROM_EMAIL || "KnotEngine <noreply@knotengine.com>",
        to: params.to,
        subject: "Sign in to KnotEngine",
        html: template,
      });

      console.log(`✅ Magic link sent to ${params.to} (${info.messageId})`);
      return { success: true };
    } catch (err) {
      console.error("❌ Email service error:", err);
      return { success: false, error: "Failed to send email" };
    }
  }

  /**
   * Send email verification email
   */
  static async sendVerificationEmail(params: {
    to: string;
    verificationLink: string;
  }): Promise<{ success: boolean; error?: string }> {
    const transporter = this.getTransporter();

    if (!transporter) {
      console.warn("⚠️ Email service not configured. Skipping email.");
      return { success: false, error: "Email service not configured" };
    }

    const template = EmailTemplates.getVerificationEmailHtml(
      params.verificationLink,
      params.to,
    );

    try {
      const info = await transporter.sendMail({
        from: process.env.FROM_EMAIL || "KnotEngine <noreply@knotengine.com>",
        to: params.to,
        subject: "Verify your email - KnotEngine",
        html: template,
      });

      console.log(
        `✅ Verification email sent to ${params.to} (${info.messageId})`,
      );
      return { success: true };
    } catch (err) {
      console.error("❌ Email service error:", err);
      return { success: false, error: "Failed to send email" };
    }
  }
}
