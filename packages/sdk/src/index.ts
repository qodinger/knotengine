import axios, { AxiosInstance } from "axios";
import * as crypto from "crypto";

export interface TyePayConfig {
  apiKey: string;
  baseUrl?: string;
  webhookSecret?: string;
}

export interface CreateInvoiceRequest {
  amount_usd: number;
  currency: "BTC" | "LTC" | "ETH" | "USDT_ERC20" | "USDT_POLYGON";
  metadata?: Record<string, unknown>;
  ttl_minutes?: number;
}

export interface InvoiceResponse {
  invoice_id: string;
  amount_usd: number;
  crypto_amount: number;
  crypto_currency: string;
  pay_address: string;
  status: string;
  expires_at: string;
  created_at: string;
}

export class TyePay {
  private client: AxiosInstance;
  private webhookSecret?: string;

  constructor(config: TyePayConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl || "https://api.tyepay.com",
      headers: {
        "x-api-key": config.apiKey,
        "Content-Type": "application/json",
      },
    });
    this.webhookSecret = config.webhookSecret;
  }

  /**
   * Create a new payment invoice
   */
  async createInvoice(data: CreateInvoiceRequest): Promise<InvoiceResponse> {
    const response = await this.client.post("/v1/invoices", data);
    return response.data;
  }

  /**
   * Get the current status of an invoice
   */
  async getInvoice(invoiceId: string): Promise<InvoiceResponse> {
    const response = await this.client.get(`/v1/invoices/${invoiceId}`);
    return response.data;
  }

  /**
   * Verify a webhook signature (HMAC-SHA256)
   */
  verifyWebhook(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      throw new Error("Webhook secret not configured in SDK.");
    }

    const expectedSignature = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(payload)
      .digest("hex");

    return signature === expectedSignature;
  }
}
