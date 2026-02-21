export interface TestnetInvoice {
  invoice_id: string;
  amount_usd: number;
  crypto_amount: number;
  crypto_currency: string;
  pay_address: string;
  status: string;
  created_at: string;
}

export interface MerchantConfig {
  btcXpub?: string;
  btcXpubTestnet?: string;
  ethAddress?: string;
  ethAddressTestnet?: string;
}
