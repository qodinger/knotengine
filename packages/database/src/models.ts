import mongoose, { Schema, Document } from "mongoose";

export interface IMerchant extends Document {
  name: string;
  apiKeyHash: string;
  btcXpub?: string;
  ethAddress?: string;
  webhookUrl?: string;
  createdAt: Date;
}

const MerchantSchema: Schema = new Schema({
  name: { type: String, required: true },
  apiKeyHash: { type: String, required: true, unique: true },
  btcXpub: { type: String },
  ethAddress: { type: String },
  webhookUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Merchant = mongoose.model<IMerchant>("Merchant", MerchantSchema);

export interface IInvoice extends Document {
  merchantId: mongoose.Types.ObjectId;
  amountUsd: number;
  cryptoAmount: number;
  cryptoCurrency: string;
  payAddress: string;
  status: string;
  expiresAt: Date;
  txHash?: string;
  metadata?: any;
}

const InvoiceSchema: Schema = new Schema({
  merchantId: { type: Schema.Types.ObjectId, ref: "Merchant", required: true },
  amountUsd: { type: Number, required: true },
  cryptoAmount: { type: Number, required: true },
  cryptoCurrency: { type: String, required: true },
  payAddress: { type: String, required: true, unique: true },
  status: { type: String, default: "pending" },
  expiresAt: { type: Date, required: true },
  txHash: { type: String },
  metadata: { type: Schema.Types.Mixed },
});

export const Invoice = mongoose.model<IInvoice>("Invoice", InvoiceSchema);
