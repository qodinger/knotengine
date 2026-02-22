import { z } from "zod";

export const merchantSettingsSchema = z.object({
  merchantId: z.string().optional(),
  businessName: z.string().min(1, "Merchant name is required"),
  businessEmail: z.string().email("Invalid email address").or(z.literal("")),
  logoUrl: z.string().optional(),
  returnUrl: z.string().optional(),
  webhookUrl: z.string().optional(),
  webhookSecret: z.string().optional(),
  feeResponsibility: z.enum(["merchant", "client"]),
  invoiceExpirationMinutes: z.number().min(15).max(43200),
  underpaymentTolerancePercentage: z.number().min(0).max(10),
  bip21Enabled: z.boolean(),
  enabledCurrencies: z.array(z.string()),
});

export type MerchantSettings = z.infer<typeof merchantSettingsSchema>;

export const webhookSchema = z.object({
  webhookUrl: z.string().url("Invalid URL").or(z.literal("")),
  webhookEvents: z.array(z.string()),
});

export type WebhookFormData = z.infer<typeof webhookSchema>;

export interface TwoFASetupData {
  secret: string;
  qrCode: string;
}
