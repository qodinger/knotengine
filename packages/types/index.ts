// ============================================================
// @tyepay/types — Shared type definitions for the Knot Engine
// ============================================================

export type Currency = "BTC" | "USDT_POLYGON" | "USDT_ERC20" | "LTC" | "ETH";

export type InvoiceStatus =
  | "pending"
  | "mempool_detected"
  | "confirming"
  | "confirmed"
  | "expired"
  | "failed";

export interface Merchant {
  id: string;
  name: string;
  btc_xpub?: string;
  eth_address?: string;
  webhook_url?: string;
  derivation_index: number;
  confirmation_policy: {
    BTC: number;
    LTC: number;
    ETH: number;
  };
  is_active: boolean;
}

export interface Invoice {
  id: string;
  invoice_id: string;
  merchant_id: string;
  amount_usd: number;
  crypto_amount: number;
  crypto_currency: Currency;
  pay_address: string;
  derivation_index: number;
  status: InvoiceStatus;
  confirmations: number;
  required_confirmations: number;
  expires_at: Date;
  tx_hash?: string;
  block_number?: number;
  is_agentic_payment: boolean;
  metadata?: Record<string, unknown>;
  paid_at?: Date;
}

export interface WebhookEvent {
  id: string;
  source: string;
  event_type: string;
  to_address: string;
  tx_hash: string;
  amount: string;
  asset: string;
  block_number: number;
  confirmations: number;
  processed: boolean;
  invoice_id?: string;
}

/** x402 Payment Required response structure */
export interface X402PaymentRequired {
  error: "Payment Required";
  invoice_id: string;
  payment_details: {
    amount: number;
    currency: Currency;
    address: string;
    expires_at: string;
  };
}

/** x402 Payment header from an AI agent */
export interface X402PaymentHeader {
  /** The invoice ID being paid */
  invoice_id: string;
  /** Transaction hash proving payment */
  tx_hash: string;
}

/** Default confirmation depths per currency */
export const DEFAULT_CONFIRMATIONS: Record<string, number> = {
  BTC: 2,
  LTC: 6,
  ETH: 12,
  USDT_ERC20: 12,
  USDT_POLYGON: 30,
};
