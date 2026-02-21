export interface DashboardStats {
  totalVolume: number;
  activeInvoices: number;
  successRate: string;
  chartData: Array<{ name: string; volume: number }>;
  feesAccrued: { usd: number };
  creditBalance: number;
  currentFeeRate: number;
}

export interface Invoice {
  invoice_id: string;
  amount_usd: number;
  crypto_amount: number;
  crypto_currency: string;
  status: "pending" | "confirmed" | "expired" | "partially_paid";
  created_at: string;
}

export type OverviewPeriod = "24h" | "7d" | "30d";
