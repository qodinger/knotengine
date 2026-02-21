export interface MerchantProfile {
  id: string;
  name: string;
  btcXpub: string | null;
  ethAddress: string | null;
  btcXpubTestnet: string | null;
  ethAddressTestnet: string | null;
  enabledCurrencies: string[];
  feesAccrued: { usd: number } | null;
}

export interface StatsData {
  totalVolume: number;
  activeInvoices: number;
  successRate: string;
  feesAccrued: { usd: number };
  currentFeeRate: number;
}

export interface Invoice {
  invoice_id: string;
  amount_usd: number;
  crypto_amount: number;
  crypto_currency: string;
  status: string;
  created_at: string;
}

export interface WalletInfo {
  id: string;
  label: string;
  currency: string;
  network: string;
  address: string;
  type: string;
  iconUrl: string;
  iconColor: string;
  iconFallback: string;
}
