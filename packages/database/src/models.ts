import mongoose, { Schema, Document } from "mongoose";

// ============================================================
// 🏪 MERCHANT MODEL
// Stores merchant settings, public derivation keys, and API auth.
// ============================================================

export interface IMerchant extends Document {
  name: string;
  apiKeyHash: string;
  btcXpub?: string;
  ethAddress?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  /** Current derivation index for unique address generation */
  derivationIndex: number;
  /** Required confirmations per currency */
  confirmationPolicy: {
    BTC: number;
    LTC: number;
    ETH: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MerchantSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    apiKeyHash: { type: String, required: true, unique: true },
    btcXpub: { type: String },
    ethAddress: { type: String },
    webhookUrl: { type: String },
    webhookSecret: { type: String },
    derivationIndex: { type: Number, default: 0 },
    confirmationPolicy: {
      type: {
        BTC: { type: Number, default: 2 },
        LTC: { type: Number, default: 6 },
        ETH: { type: Number, default: 12 },
      },
      default: { BTC: 2, LTC: 6, ETH: 12 },
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
  | "failed";

export interface IInvoice extends Document {
  merchantId: mongoose.Types.ObjectId;
  /** Human-readable invoice identifier (e.g. inv_abc123) */
  invoiceId: string;
  amountUsd: number;
  cryptoAmount: number;
  cryptoCurrency: string;
  payAddress: string;
  /** Tyecode Tax (Platform Fee) */
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
  /** x402 agentic payment flag */
  isAgenticPayment: boolean;
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
    isAgenticPayment: { type: Boolean, default: false },
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

export const WebhookEvent = mongoose.model<IWebhookEvent>(
  "WebhookEvent",
  WebhookEventSchema,
);
