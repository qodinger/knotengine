export interface DashboardStats {
  totalVolume: number;
  activeInvoices: number;
  pendingInvoices: number;
  confirmedInvoices: number;
  successRate: string;
  conversionRate: string;
  chartData: Array<{ name: string; volume: number }>;
  feesAccrued: { usd: number };
  creditBalance: number;
  currentFeeRate: number;
  currentPlan: "starter" | "professional" | "enterprise";
  topCurrencies: Array<{ currency: string; count: number; volume: number }>;
  testnetVolume?: number;
  testnetInvoicesCount?: number;
  isGracePeriod?: boolean;
  gracePeriodEnds?: string;
  platformFeeWallets?: {
    BTC: string | null;
    LTC: string | null;
    EVM: string | null;
  };
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
