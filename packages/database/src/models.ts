import mongoose, { Schema, Document } from "mongoose";

// ============================================================
// 🏪 MERCHANT MODEL
// Stores merchant settings, public derivation keys, and API auth.
// ============================================================

export interface IMerchant extends Document {
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
  /** Prepaid credit balance (USD) — deducted per confirmed invoice */
  creditBalance: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MerchantSchema: Schema = new Schema(
  {
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
    enabledCurrencies: { type: [String], default: [] },
    webhookEvents: {
      type: [String],
      default: [
        "invoice.confirmed",
        "invoice.mempool_detected",
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
    creditBalance: { type: Number, default: 5.0 },
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
  | "failed";

export interface IInvoice extends Document {
  merchantId: mongoose.Types.ObjectId;
  /** Human-readable invoice identifier (e.g. inv_abc123) */
  invoiceId: string;
  amountUsd: number;
  cryptoAmount: number;
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
  /** Arbitrary metadata from merchant */
  metadata?: Record<string, unknown>;
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
    cryptoCurrency: { type: String, required: true },
    payAddress: { type: String, required: true, unique: true },
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
    metadata: { type: Schema.Types.Mixed },
    paidAt: { type: Date },
  },
  { timestamps: true },
);

InvoiceSchema.index({ merchantId: 1, status: 1 });
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
// 30-day Retention: MongoDB will auto-delete notifications older than 30 days
NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30 },
);

export const Notification = mongoose.model<INotification>(
  "Notification",
  NotificationSchema,
);
