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
    feeResponsibility?: "client" | "merchant";
  };
  merchant?: {
    name: string;
    logo_url?: string | null;
    return_url?: string | null;
    theme?: "light" | "dark" | "system";
    brand_color?: string;
    branding_enabled?: boolean;
    remove_branding?: boolean;
    bip21_enabled?: boolean;
    plan?: "starter" | "professional" | "enterprise";
  };
  description?: string;
}
