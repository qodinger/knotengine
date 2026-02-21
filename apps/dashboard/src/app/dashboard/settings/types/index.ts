export interface MerchantSettings {
  businessName: string;
  businessEmail: string;
  logoUrl: string;
  returnUrl: string;
  webhookUrl: string;
  webhookSecret: string;
}

export interface TwoFASetupData {
  secret: string;
  qrCode: string;
}
