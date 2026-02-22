import axios, { AxiosInstance } from "axios";
import * as crypto from "crypto";

export interface KnotClientConfig {
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
  checkout_url: string;
  expires_at: string;
  created_at: string;
  is_testnet: boolean;
}

export class KnotClient {
  private client: AxiosInstance;
  private webhookSecret?: string;

  constructor(config: KnotClientConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl || "http://localhost:5050",
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
  verifyWebhook(payload: string, signature: string, secret?: string): boolean {
    const verifSecret = secret || this.webhookSecret;
    if (!verifSecret) {
      throw new Error(
        "Webhook secret not provided. Pass it to verifyWebhook() or set it in the constructor.",
      );
    }

    const expectedSignature = crypto
      .createHmac("sha256", verifSecret)
      .update(payload)
      .digest("hex");

    return signature === expectedSignature;
  }
}
