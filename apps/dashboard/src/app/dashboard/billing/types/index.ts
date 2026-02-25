export interface StatsData {
  totalVolume: number;
  testnetVolume: number;
  testnetInvoicesCount: number;
  activeInvoices: number;
  feesAccrued: { usd: number };
  creditBalance: number;
  currentPlan: "starter" | "professional" | "enterprise";
  currentFeeRate: number;
  platformFeeWallets: {
    BTC: string | null;
    LTC: string | null;
    EVM: string | null;
  };
  isGracePeriod?: boolean;
  gracePeriodEnds?: string;
}
