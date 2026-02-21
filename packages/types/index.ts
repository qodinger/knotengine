// ============================================================
// @qodinger/knot-types — Shared type definitions for KnotEngine
// ============================================================

export const SUPPORTED_CURRENCIES = [
  "BTC",
  "LTC",
  "ETH",
  "USDT_ERC20",
  "USDT_POLYGON",
] as const;

export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export const EVM_CURRENCIES: Currency[] = ["ETH", "USDT_ERC20", "USDT_POLYGON"];

export const CRYPTO_LOGOS: Record<Currency, string> = {
  BTC: "https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=032",
  LTC: "https://cryptologos.cc/logos/litecoin-ltc-logo.svg?v=032",
  ETH: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=032",
  USDT_ERC20: "https://cryptologos.cc/logos/tether-usdt-logo.svg?v=032",
  USDT_POLYGON: "https://cryptologos.cc/logos/tether-usdt-logo.svg?v=032",
};

export const CRYPTO_LABELS: Record<Currency, string> = {
  BTC: "Bitcoin (BTC)",
  LTC: "Litecoin (LTC)",
  ETH: "Ethereum (ETH)",
  USDT_ERC20: "Tether (USDT) on Ethereum",
  USDT_POLYGON: "Tether (USDT) on Polygon",
};

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
  metadata?: Record<string, unknown>;
  paidAt?: Date;
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

/** Default confirmation depths per currency */
export const DEFAULT_CONFIRMATIONS: Record<string, number> = {
  BTC: 2,
  LTC: 6,
  ETH: 12,
  USDT_ERC20: 12,
  USDT_POLYGON: 30,
};
