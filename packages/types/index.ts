export type Currency = "BTC" | "USDT_POLYGON" | "USDT_ERC20" | "LTC";

export type InvoiceStatus = "pending" | "confirmed" | "expired";

export interface Merchant {
  id: string;
  name: string;
  btc_xpub?: string;
  eth_address?: string;
  webhook_url?: string;
}

export interface Invoice {
  id: string;
  merchant_id: string;
  amount_usd: number;
  crypto_amount: number;
  crypto_currency: Currency;
  pay_address: string;
  status: InvoiceStatus;
  expires_at: Date;
  tx_hash?: string;
}
