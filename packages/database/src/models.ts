import mongoose, { Schema, Document } from "mongoose";

// ============================================================
// 👤 USER MODEL
// Represents an identity (OAuth user) that can own multiple merchants.
// Holds the shared credit balance and yield earnings.
// ============================================================

export interface IUser extends Document {
  oauthId: string;
  email?: string;
  /** Email verification status */
  emailVerified: boolean;
  /** Shared prepaid credit balance (USD) across all merchants */
  creditBalance: number;
  /** Total yield accrued by this user's funds */
  yieldAccruedUsd: number;
  lastYieldSyncAt?: Date;
  welcomeBonusClaimed: boolean;
  /** TOTP Two-Factor Authentication */
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  twoFactorBackupCodes?: string[];
  /** Referral System */
  referralCode?: string;
  referredBy?: mongoose.Types.ObjectId;
  referralEarningsUsd: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    oauthId: { type: String, unique: true, required: true },
    email: { type: String, sparse: true },
    emailVerified: { type: Boolean, default: false },
    creditBalance: { type: Number, default: 0 },
    yieldAccruedUsd: { type: Number, default: 0 },
    lastYieldSyncAt: { type: Date },
    welcomeBonusClaimed: { type: Boolean, default: false },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
    twoFactorBackupCodes: { type: [String], default: [] },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: Schema.Types.ObjectId, ref: "User" },
    referralEarningsUsd: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const User = mongoose.model<IUser>("User", UserSchema);

// ============================================================
// 🏪 MERCHANT MODEL
// Holds merchant settings, public derivation keys, and API auth.
// ============================================================

export interface IMerchant extends Document {
  /** Public-facing ID e.g. 'mid_abc123' */
  merchantId: string;
  userId?: mongoose.Types.ObjectId;
  name: string;
  apiKeyHash?: string;
  /** OAuth identity string e.g. 'google:1234567890' */
  oauthId?: string;
  email?: string;
  btcXpub?: string;
  btcXpubTestnet?: string;
  ethAddress?: string;
  ethAddressTestnet?: string;
  ethXpub?: string;
  ethXpubTestnet?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  webhookEvents?: string[];
  logoUrl?: string;
  returnUrl?: string;
  theme: "light" | "dark" | "system";
  brandColor?: string;
  brandingEnabled: boolean;
  /** Hide "Powered by KnotEngine" footer (Pro/Enterprise only) */
  removeBranding: boolean;
  enabledCurrencies: string[];
  /** Current derivation index for unique address generation */
  derivationIndex: number;
  /** Required confirmations per currency */
  confirmationPolicy: {
    BTC: number;
    LTC: number;
    ETH: number;
  };
  feesAccrued: {
    usd: number;
    BTC: number;
    LTC: number;
    ETH: number;
    USDT_ERC20: number;
    USDT_POLYGON: number;
  };
  /** Payment Configuration */
  feeResponsibility: "merchant" | "client";
  invoiceExpirationMinutes: number;
  underpaymentTolerancePercentage: number;
  bip21Enabled: boolean;
  plan: "starter" | "professional" | "enterprise";
  planStartedAt?: Date;
  /** Track prorated billing for mid-month activations */
  lastProratedAmount?: number;
  lastProratedDate?: Date;
  /** Grace period for insufficient balance */
  gracePeriodStarted?: Date;
  gracePeriodEnds?: Date;
  /** IP Allowlisting for API access */
  allowedIpAddresses?: string[];
  ipAllowlistEnabled: boolean;
  /** Email Notification Preferences */
  emailNotifications: {
    paymentReceived: boolean;
    paymentConfirmed: boolean;
    paymentOverpaid: boolean;
    paymentExpired: boolean;
    subscriptionCharged: boolean;
    lowBalance: boolean;
    securityAlerts: boolean;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MerchantSchema: Schema = new Schema(
  {
    merchantId: { type: String, unique: true, sparse: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    name: { type: String, default: "" },
    apiKeyHash: { type: String, sparse: true, unique: true },
    oauthId: { type: String, sparse: true },
    email: { type: String, sparse: true },
    btcXpub: { type: String },
    btcXpubTestnet: { type: String },
    ethAddress: { type: String },
    ethAddressTestnet: { type: String },
    ethXpub: { type: String },
    ethXpubTestnet: { type: String },
    webhookUrl: { type: String },
    webhookSecret: { type: String },
    logoUrl: { type: String },
    returnUrl: { type: String },
    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "system",
    },
    brandColor: { type: String, default: "#ffffff" },
    brandingEnabled: { type: Boolean, default: true },
    removeBranding: { type: Boolean, default: false },
    enabledCurrencies: { type: [String], default: [] },
    webhookEvents: {
      type: [String],
      default: [
        "invoice.confirmed",
        "invoice.mempool_detected",
        "invoice.partially_paid",
        "invoice.overpaid",
        "invoice.expired",
        "invoice.failed",
      ],
    },
    derivationIndex: { type: Number, default: 0 },
    confirmationPolicy: {
      type: {
        BTC: { type: Number, default: 2 },
        LTC: { type: Number, default: 6 },
        ETH: { type: Number, default: 12 },
      },
      default: { BTC: 2, LTC: 6, ETH: 12 },
    },
    feesAccrued: {
      usd: { type: Number, default: 0 },
      BTC: { type: Number, default: 0 },
      LTC: { type: Number, default: 0 },
      ETH: { type: Number, default: 0 },
      USDT_ERC20: { type: Number, default: 0 },
      USDT_POLYGON: { type: Number, default: 0 },
    },
    feeResponsibility: {
      type: String,
      enum: ["merchant", "client"],
      default: "merchant",
    },
    invoiceExpirationMinutes: { type: Number, default: 30 },
    underpaymentTolerancePercentage: { type: Number, default: 1 },
    bip21Enabled: { type: Boolean, default: true },
    plan: {
      type: String,
      enum: ["starter", "professional", "enterprise"],
      default: "starter",
    },
    planStartedAt: { type: Date, default: Date.now },
    lastProratedAmount: { type: Number },
    lastProratedDate: { type: Date },
    gracePeriodStarted: { type: Date },
    gracePeriodEnds: { type: Date },
    /** IP Allowlisting for API access */
    allowedIpAddresses: { type: [String], default: [] },
    ipAllowlistEnabled: { type: Boolean, default: false },
    /** Email Notification Preferences */
    emailNotifications: {
      type: {
        paymentReceived: { type: Boolean, default: true },
        paymentConfirmed: { type: Boolean, default: true },
        paymentOverpaid: { type: Boolean, default: true },
        paymentExpired: { type: Boolean, default: true },
        subscriptionCharged: { type: Boolean, default: true },
        lowBalance: { type: Boolean, default: true },
        securityAlerts: { type: Boolean, default: true },
      },
      default: {
        paymentReceived: true,
        paymentConfirmed: true,
        paymentOverpaid: true,
        paymentExpired: true,
        subscriptionCharged: true,
        lowBalance: true,
        securityAlerts: true,
      },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// apiKeyHash index is auto-created by unique: true

export const Merchant = mongoose.model<IMerchant>("Merchant", MerchantSchema);

// ============================================================
// 🧾 INVOICE MODEL
// Tracks individual payment requests and their full lifecycle.
// ============================================================

export type InvoiceStatus =
  | "pending"
  | "mempool_detected"
  | "confirming"
  | "confirmed"
  | "expired"
  | "failed"
  | "partially_paid"
  | "overpaid";

export interface IInvoice extends Document {
  merchantId: mongoose.Types.ObjectId;
  /** Human-readable invoice identifier (e.g. inv_abc123) */
  invoiceId: string;
  amountUsd: number;
  cryptoAmount: number;
  cryptoAmountReceived: number;
  /** Last received amount for incremental tracking */
  lastReceivedAmount?: number;
  /** Timestamp of last payment received */
  lastReceivedAt?: Date;
  cryptoCurrency: string;
  payAddress: string;
  /** KnotEngine Fee (Platform Fee) */
  feeUsd: number;
  feeCrypto: number;
  derivationIndex: number;
  status: InvoiceStatus;
  /** Number of block confirmations received */
  confirmations: number;
  /** Required confirmations for this invoice */
  requiredConfirmations: number;
  expiresAt: Date;
  txHash?: string;
  /** Block number where the transaction was first seen */
  blockNumber?: number;
  /** Webhook delivery tracking */
  webhookDelivered: boolean;
  webhookAttempts: number;
  lastWebhookAttempt?: Date;
  /** Tatum Notification Subscription ID */
  tatumSubscriptionId?: string;
  /** Name of the provider used for monitoring (e.g. 'tatum') */
  providerName?: string;
  /** Tracking for On-Demand monitoring attempts */
  lastMonitoringAttempt?: Date;
  monitoringAttempts: number;
  /** Arbitrary metadata from merchant */
  metadata?: Record<string, unknown>;
  /** Optional description/memo for the invoice */
  description?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema: Schema = new Schema(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: "Merchant",
      required: true,
    },
    invoiceId: { type: String, required: true, unique: true },
    amountUsd: { type: Number, required: true },
    cryptoAmount: { type: Number, required: true },
    cryptoAmountReceived: { type: Number, default: 0 },
    lastReceivedAmount: { type: Number },
    lastReceivedAt: { type: Date },
    cryptoCurrency: { type: String, required: true },
    payAddress: { type: String, required: true },
    feeUsd: { type: Number, required: true, default: 0 },
    feeCrypto: { type: Number, required: true, default: 0 },
    derivationIndex: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "pending",
        "mempool_detected",
        "confirming",
        "confirmed",
        "expired",
        "failed",
        "partially_paid",
        "overpaid",
      ],
      default: "pending",
    },
    confirmations: { type: Number, default: 0 },
    requiredConfirmations: { type: Number, required: true },
    expiresAt: { type: Date, required: true },
    txHash: { type: String },
    blockNumber: { type: Number },
    webhookDelivered: { type: Boolean, default: false },
    webhookAttempts: { type: Number, default: 0 },
    lastWebhookAttempt: { type: Date },
    tatumSubscriptionId: { type: String },
    providerName: { type: String },
    lastMonitoringAttempt: { type: Date },
    monitoringAttempts: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed },
    description: { type: String },
    paidAt: { type: Date },
  },
  { timestamps: true },
);

InvoiceSchema.index({ merchantId: 1, status: 1 });
InvoiceSchema.index({ invoiceId: 1, status: 1 });
InvoiceSchema.index({ merchantId: 1, "metadata.isTestnet": 1, createdAt: -1 });
InvoiceSchema.index({ payAddress: 1, status: 1 });
InvoiceSchema.index({ expiresAt: 1, status: 1 });
InvoiceSchema.index({ webhookDelivered: 1, webhookAttempts: 1, status: 1 });
InvoiceSchema.index({ merchantId: 1, status: 1, createdAt: -1 });
// payAddress + invoiceId indexes are auto-created by unique: true
InvoiceSchema.index({ status: 1, expiresAt: 1 });

export const Invoice = mongoose.model<IInvoice>("Invoice", InvoiceSchema);

// ============================================================
// 📡 WEBHOOK EVENT MODEL
// Audit trail for all incoming blockchain events.
// ============================================================

export interface IWebhookEvent extends Document {
  /** Source provider: 'alchemy' | 'tatum' | 'manual' */
  source: string;
  /** Raw event type from provider */
  eventType: string;
  /** The address that received the transaction */
  toAddress: string;
  /** Transaction hash */
  txHash: string;
  /** Amount in the native/token unit */
  amount: string;
  /** Asset symbol (ETH, BTC, USDT, etc.) */
  asset: string;
  /** Block number (-1 for mempool/pending) */
  blockNumber: number;
  /** Number of confirmations at time of event */
  confirmations: number;
  /** Whether this event was processed */
  processed: boolean;
  /** Linked Invoice ID (if matched) */
  invoiceId?: mongoose.Types.ObjectId;
  /** Full raw payload from provider */
  rawPayload: Record<string, unknown>;
  createdAt: Date;
}

const WebhookEventSchema: Schema = new Schema(
  {
    source: { type: String, required: true },
    eventType: { type: String, required: true },
    toAddress: { type: String, required: true },
    txHash: { type: String, required: true },
    amount: { type: String, required: true },
    asset: { type: String, required: true },
    blockNumber: { type: Number, default: -1 },
    confirmations: { type: Number, default: 0 },
    processed: { type: Boolean, default: false },
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice" },
    rawPayload: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

WebhookEventSchema.index({ toAddress: 1 });
WebhookEventSchema.index({ txHash: 1 });
WebhookEventSchema.index({ processed: 1 });
// 30-day Retention: MongoDB will auto-delete events older than 30 days
WebhookEventSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30 },
);

export const WebhookEvent = mongoose.model<IWebhookEvent>(
  "WebhookEvent",
  WebhookEventSchema,
);

// ============================================================
// 💰 TOPUP CLAIM MODEL
// Tracks merchant top-up TX IDs to prevent double-claiming.
// ============================================================

export interface ITopUpClaim extends Document {
  merchantId: mongoose.Types.ObjectId;
  txHash: string;
  currency: string;
  amountCrypto: number;
  amountUsd: number;
  status: "approved" | "rejected" | "pending";
  createdAt: Date;
  updatedAt: Date;
}

const TopUpClaimSchema: Schema = new Schema(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: "Merchant",
      required: true,
    },
    txHash: { type: String, required: true, unique: true }, // Prevent double-claiming globally
    currency: { type: String, required: true },
    amountCrypto: { type: Number, required: true },
    amountUsd: { type: Number, required: true },
    status: {
      type: String,
      enum: ["approved", "rejected", "pending"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export const TopUpClaim = mongoose.model<ITopUpClaim>(
  "TopUpClaim",
  TopUpClaimSchema,
);
// ============================================================
// 🔔 NOTIFICATION MODEL
// Persists in-app notifications for merchants.
// ============================================================

export interface INotification extends Document {
  merchantId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: "success" | "warning" | "error" | "info";
  isRead: boolean;
  /** Optional reference to related entities (InvoiceId, TopUpClaimId, etc) */
  link?: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: "Merchant",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: ["success", "warning", "error", "info"],
      default: "info",
    },
    isRead: { type: Boolean, default: false },
    link: { type: String },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

NotificationSchema.index({ merchantId: 1, isRead: 1 });
NotificationSchema.index({ merchantId: 1, "meta.invoiceId": 1, isRead: 1 });
// 30-day Retention: MongoDB will auto-delete notifications older than 30 days
NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30 },
);

export const Notification = mongoose.model<INotification>(
  "Notification",
  NotificationSchema,
);

// ============================================================
// 🎫 VERIFICATION TOKEN MODEL
// Stores temporary tokens for Magic Link and OTP verification.
// ============================================================

export interface IVerificationToken extends Document {
  identifier: string; // email or user id
  token: string;
  expires: Date;
  createdAt: Date;
}

const VerificationTokenSchema: Schema = new Schema(
  {
    identifier: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    expires: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

VerificationTokenSchema.index({ identifier: 1, token: 1 }, { unique: true });
// Tokens expire automatically
VerificationTokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

export const VerificationToken = mongoose.model<IVerificationToken>(
  "VerificationToken",
  VerificationTokenSchema,
);

// ============================================================
// 📋 AUDIT LOG MODEL
// Tracks all account changes and security events for compliance.
// ============================================================

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  action: string;
  category: "auth" | "account" | "security" | "billing" | "settings";
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: { type: String, required: true },
    category: {
      type: String,
      enum: ["auth", "account", "security", "billing", "settings"],
      required: true,
      index: true,
    },
    description: { type: String, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

// Indexes for efficient querying
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ category: 1, createdAt: -1 });
// 90-day Retention: MongoDB will auto-delete audit logs older than 90 days
AuditLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 },
);

export const AuditLog = mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

// ============================================================
// 🎟️ PROMO CODE MODEL
// Stores redeemable codes for credit balance.
// ============================================================

export interface IPromoCode extends Document {
  code: string;
  amountUsd: number;
  /** Maximum number of times this code can be used globally */
  maxUses: number;
  /** Current number of times it has been used */
  uses: number;
  /** Users who have already claimed this code */
  claimedBy: mongoose.Types.ObjectId[];
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PromoCodeSchema: Schema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    amountUsd: { type: Number, required: true },
    maxUses: { type: Number, default: 1 },
    uses: { type: Number, default: 0 },
    claimedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Auto-expire codes if expiresAt is set
PromoCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PromoCode = mongoose.model<IPromoCode>(
  "PromoCode",
  PromoCodeSchema,
);
