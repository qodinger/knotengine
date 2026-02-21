export interface StatsData {
  totalVolume: number;
  testnetVolume: number;
  testnetInvoicesCount: number;
  activeInvoices: number;
  feesAccrued: { usd: number };
  creditBalance: number;
  currentFeeRate: number;
  platformFeeWallets: {
    BTC: string | null;
    LTC: string | null;
    EVM: string | null;
  };
}
