export type InvoiceStatus =
  | "pending"
  | "confirmed"
  | "expired"
  | "partially_paid"
  | "overpaid"
  | "confirming"
  | "mempool_detected";

export interface Invoice {
  invoice_id: string;
  amount_usd: number;
  crypto_amount: number;
  crypto_amount_received?: number;
  crypto_currency: string;
  pay_address: string;
  status: InvoiceStatus;
  confirmations: number;
  required_confirmations: number;
  tx_hash: string | null;
  expires_at: string;
  paid_at: string | null;
  created_at: string;
  metadata?: {
    isTestnet?: boolean;
    network?: string;
  };
}

export interface TimelineEvent {
  _id?: string;
  title: string;
  description: string;
  createdAt: string;
  type: string;
}
