import nodemailer from "nodemailer";
import { EmailTemplates } from "../core/email-templates.js";

/**
 * 📧 Email Service
 *
 * Handles sending transactional emails via Gmail SMTP or SendGrid.
 * Supports payment alerts, security notifications, and billing emails.
 *
 * Gmail Setup (Primary):
 * 1. Go to https://myaccount.google.com/apppasswords
 * 2. Create app password for "Mail"
 * 3. Add to .env:
 *    GMAIL_USER=your-email@gmail.com
 *    GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
 *
 * SendGrid Setup (Fallback/Alternative):
 * 1. Sign up at https://sendgrid.com
 * 2. Create API key: Settings -> API Keys -> Create API Key
 * 3. Add to .env:
 *    SENDGRID_API_KEY=SG.xxxxx
 *    SENDGRID_FROM_EMAIL=verified-sender@yourdomain.com
 *
 * Rate Limits:
 * - Gmail: 500 emails/day (free), 2,000/day (Workspace)
 * - SendGrid: 100 emails/day (free), 40,000/month ($19.95/mo)
 *
 * 🔄 Automatic Failover:
 * If Gmail fails 3+ times, automatically switches to SendGrid (if configured)
 */

export class EmailService {
  private static _transporter: nodemailer.Transporter | null = null;
  private static _sendgridTransporter: nodemailer.Transporter | null = null;
  private static _gmailFailureCount = 0;
  private static readonly GMAIL_FAILURE_THRESHOLD = 3;
  private static _useSendGrid = false;

  /**
   * Check if SendGrid is configured
   */
  private static isSendGridConfigured(): boolean {
    return !!(process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL);
  }

  /**
   * Get SendGrid transporter (lazy-loaded)
   */
  private static getSendGridTransporter(): nodemailer.Transporter | null {
    if (!this._sendgridTransporter) {
      const apiKey = process.env.SENDGRID_API_KEY;
      const fromEmail = process.env.SENDGRID_FROM_EMAIL;

      if (!apiKey || !fromEmail) {
        return null;
      }

      this._sendgridTransporter = nodemailer.createTransport({
        host: "smtp.sendgrid.net",
        port: 587,
        secure: false,
        auth: {
          user: "apikey",
          pass: apiKey,
        },
      });
    }

    return this._sendgridTransporter;
  }

  /**
   * Switch to SendGrid if Gmail is failing
   */
  private static switchToSendGrid(): void {
    if (this.isSendGridConfigured()) {
      this._useSendGrid = true;
      console.log("🔄 Switched to SendGrid due to Gmail failures");
    } else {
      console.warn("⚠️ Gmail failing and SendGrid not configured");
    }
  }

  /**
   * Reset Gmail failure count on success
   */
  private static resetGmailFailureCount(): void {
    if (this._gmailFailureCount > 0) {
      console.log(
        `✅ Gmail working again, resetting failure count (${this._gmailFailureCount} failures)`,
      );
      this._gmailFailureCount = 0;
      this._useSendGrid = false;
    }
  }

  /**
   * Lazy-load transporter (ensures env vars are loaded first)
   */
  private static getTransporter(): nodemailer.Transporter | null {
    // If already switched to SendGrid, use it
    if (this._useSendGrid) {
      const sgTransporter = this.getSendGridTransporter();
      if (sgTransporter) return sgTransporter;
    }

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

        // Fall back to SendGrid if available
        const sgTransporter = this.getSendGridTransporter();
        if (sgTransporter) {
          console.log("🔄 Using SendGrid as primary (Gmail not configured)");
          this._useSendGrid = true;
          return sgTransporter;
        }

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
    const isSendGrid = this._useSendGrid;
    const fromEmail = isSendGrid
      ? process.env.SENDGRID_FROM_EMAIL || "KnotEngine <noreply@knotengine.com>"
      : process.env.FROM_EMAIL || "KnotEngine <noreply@knotengine.com>";

    try {
      const info = await transporter.sendMail({
        from: fromEmail,
        to: params.to,
        subject: `Payment ${params.status === "received" ? "Received" : params.status === "confirmed" ? "Confirmed" : params.status === "overpaid" ? "Overpaid" : "Expired"} - ${params.amount} ${params.currency}`,
        html: template,
      });

      console.log(`✅ Payment email sent to ${params.to} (${info.messageId})`);
      this.resetGmailFailureCount();
      return { success: true };
    } catch (err) {
      console.error("❌ Email service error:", err);

      // Track Gmail failures
      if (!this._useSendGrid) {
        this._gmailFailureCount++;
        console.warn(
          `⚠️ Gmail failure #${this._gmailFailureCount}/${this.GMAIL_FAILURE_THRESHOLD}`,
        );

        if (this._gmailFailureCount >= this.GMAIL_FAILURE_THRESHOLD) {
          this.switchToSendGrid();
        }
      }

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
    const isSendGrid = this._useSendGrid;
    const fromEmail = isSendGrid
      ? process.env.SENDGRID_FROM_EMAIL || "KnotEngine <noreply@knotengine.com>"
      : process.env.FROM_EMAIL || "KnotEngine <noreply@knotengine.com>";

    try {
      const info = await transporter.sendMail({
        from: fromEmail,
        to: params.to,
        subject: `Security Alert: ${params.action}`,
        html: template,
      });

      console.log(`✅ Security email sent to ${params.to} (${info.messageId})`);
      this.resetGmailFailureCount();
      return { success: true };
    } catch (err) {
      console.error("❌ Email service error:", err);

      if (!this._useSendGrid) {
        this._gmailFailureCount++;
        if (this._gmailFailureCount >= this.GMAIL_FAILURE_THRESHOLD) {
          this.switchToSendGrid();
        }
      }

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
    const isSendGrid = this._useSendGrid;
    const fromEmail = isSendGrid
      ? process.env.SENDGRID_FROM_EMAIL || "KnotEngine <noreply@knotengine.com>"
      : process.env.FROM_EMAIL || "KnotEngine <noreply@knotengine.com>";

    try {
      const info = await transporter.sendMail({
        from: fromEmail,
        to: params.to,
        subject: `Billing Notification: ${params.type.replace("_", " ")}`,
        html: template,
      });

      console.log(`✅ Billing email sent to ${params.to} (${info.messageId})`);
      this.resetGmailFailureCount();
      return { success: true };
    } catch (err) {
      console.error("❌ Email service error:", err);

      if (!this._useSendGrid) {
        this._gmailFailureCount++;
        if (this._gmailFailureCount >= this.GMAIL_FAILURE_THRESHOLD) {
          this.switchToSendGrid();
        }
      }

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
      console.log("✅ Email service connection successful");
      return true;
    } catch (err) {
      console.error("❌ Email service connection failed:", err);
      return false;
    }
  }

  /**
   * Get current email service status
   */
  static getStatus(): {
    provider: "gmail" | "sendgrid" | "none";
    gmailFailures: number;
    sendGridConfigured: boolean;
  } {
    return {
      provider: this._useSendGrid ? "sendgrid" : "gmail",
      gmailFailures: this._gmailFailureCount,
      sendGridConfigured: this.isSendGridConfigured(),
    };
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
    const isSendGrid = this._useSendGrid;
    const fromEmail = isSendGrid
      ? process.env.SENDGRID_FROM_EMAIL || "KnotEngine <noreply@knotengine.com>"
      : process.env.FROM_EMAIL || "KnotEngine <noreply@knotengine.com>";

    try {
      const info = await transporter.sendMail({
        from: fromEmail,
        to: params.to,
        subject: "Sign in to KnotEngine",
        html: template,
      });

      console.log(`✅ Magic link sent to ${params.to} (${info.messageId})`);
      this.resetGmailFailureCount();
      return { success: true };
    } catch (err) {
      console.error("❌ Email service error:", err);

      if (!this._useSendGrid) {
        this._gmailFailureCount++;
        if (this._gmailFailureCount >= this.GMAIL_FAILURE_THRESHOLD) {
          this.switchToSendGrid();
        }
      }

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
    const isSendGrid = this._useSendGrid;
    const fromEmail = isSendGrid
      ? process.env.SENDGRID_FROM_EMAIL || "KnotEngine <noreply@knotengine.com>"
      : process.env.FROM_EMAIL || "KnotEngine <noreply@knotengine.com>";

    try {
      const info = await transporter.sendMail({
        from: fromEmail,
        to: params.to,
        subject: "Verify your email - KnotEngine",
        html: template,
      });

      console.log(
        `✅ Verification email sent to ${params.to} (${info.messageId})`,
      );
      this.resetGmailFailureCount();
      return { success: true };
    } catch (err) {
      console.error("❌ Email service error:", err);

      if (!this._useSendGrid) {
        this._gmailFailureCount++;
        if (this._gmailFailureCount >= this.GMAIL_FAILURE_THRESHOLD) {
          this.switchToSendGrid();
        }
      }

      return { success: false, error: "Failed to send email" };
    }
  }
}
