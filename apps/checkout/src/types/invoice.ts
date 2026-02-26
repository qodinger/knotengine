export interface Invoice {
  invoice_id: string;
  amount_usd: number;
  crypto_amount: number;
  crypto_amount_received?: number;
  crypto_currency: string;
  pay_address: string;
  status: string;
  expires_at: string;
  fee_usd: number;
  tx_hash?: string;
  confirmations?: number;
  metadata?: {
    isTestnet?: boolean;
  };
  merchant?: {
    name: string;
    logo_url?: string | null;
    return_url?: string | null;
    bip21_enabled?: boolean;
    plan?: "starter" | "professional" | "enterprise";
  };
  description?: string;
}
