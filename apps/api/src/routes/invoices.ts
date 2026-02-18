import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { Invoice, Merchant } from "@tyepay/database";
import { Derivator } from "@tyepay/crypto";
import { PriceOracle } from "../infra/price-feed";
import { ConfirmationEngine } from "../core/confirmation-engine";
import { Currency } from "@tyepay/types";
import { TatumProvider } from "../infra/tatum-provider";
import * as crypto from "crypto";

/**
 * 🧾 Invoice Routes — /v1/invoices
 *
 * Full invoice lifecycle management:
 *   POST   /v1/invoices         → Create a new invoice
 *   GET    /v1/invoices/:id     → Get invoice status
 *   GET    /v1/invoices         → List invoices (merchant-scoped)
 *   POST   /v1/invoices/:id/cancel → Cancel a pending invoice
 */
export async function invoiceRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // ──────────────────────────────────────────────
  // Middleware: API Key Authentication
  // ──────────────────────────────────────────────
  server.addHook("preHandler", async (request, reply) => {
    // Skip auth for public invoice status check
    if (
      request.method === "GET" &&
      request.url.match(/^\/v1\/invoices\/inv_/)
    ) {
      return;
    }

    const apiKey = request.headers["x-api-key"] as string;

    if (!apiKey) {
      return reply.code(401).send({ error: "Missing X-API-Key header" });
    }

    const apiKeyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

    const merchant = await Merchant.findOne({ apiKeyHash, isActive: true });

    if (!merchant) {
      return reply.code(401).send({ error: "Invalid API key" });
    }

    // Attach merchant to request for downstream use
    (request as any).merchant = merchant;
  });

  // ──────────────────────────────────────────────
  // POST /v1/invoices — Create Invoice
  // ──────────────────────────────────────────────
  server.post(
    "/v1/invoices",
    {
      schema: {
        body: z.object({
          amount_usd: z.number().positive(),
          currency: z.enum(["BTC", "LTC", "USDT_ERC20", "USDT_POLYGON"]),
          /** Invoice TTL in minutes (default: 30) */
          ttl_minutes: z.number().int().min(5).max(1440).default(30),
          metadata: z.record(z.unknown()).optional(),
        }),
      },
    },
    async (request, reply) => {
      const merchant = (request as any).merchant;
      const { amount_usd, currency, ttl_minutes, metadata } = request.body;

      // 1. Get real-time crypto price
      const priceUsd = await PriceOracle.getPrice(currency as Currency);
      const cryptoAmount = parseFloat((amount_usd / priceUsd).toFixed(8));

      // 2. Derive a unique payment address
      const nextIndex = merchant.derivationIndex + 1;
      let payAddress: string;

      if (currency === "BTC" || currency === "LTC") {
        if (!merchant.btcXpub) {
          return reply
            .code(400)
            .send({ error: "Merchant has no BTC xPub configured" });
        }
        payAddress = Derivator.deriveBitcoinAddress(
          merchant.btcXpub,
          nextIndex,
          (process.env.BITCOIN_NETWORK as "bitcoin" | "testnet" | "regtest") ||
            "bitcoin",
        );
      } else {
        if (!merchant.ethAddress) {
          return reply
            .code(400)
            .send({ error: "Merchant has no ETH address configured" });
        }
        // For EVM tokens, we use the merchant's main address
        // In production, HD derivation with xPub would be better
        payAddress = merchant.ethAddress;
      }

      // 3. Get required confirmations
      const requiredConfirmations =
        await ConfirmationEngine.getRequiredConfirmations(
          merchant._id.toString(),
          currency,
        );

      // 4. Generate unique invoice ID
      const invoiceId = `inv_${crypto.randomBytes(12).toString("hex")}`;

      // 5. Create the invoice
      const expiresAt = new Date(Date.now() + ttl_minutes * 60 * 1000);
      const platfromFeeRate = 0.005; // 0.5% Tyecode Tax
      const feeUsd = parseFloat((amount_usd * platfromFeeRate).toFixed(2));
      const feeCrypto = parseFloat((cryptoAmount * platfromFeeRate).toFixed(8));

      const invoice = await Invoice.create({
        merchantId: merchant._id,
        invoiceId,
        amountUsd: amount_usd,
        cryptoAmount,
        cryptoCurrency: currency,
        payAddress,
        feeUsd,
        feeCrypto,
        derivationIndex: nextIndex,
        requiredConfirmations,
        expiresAt,
        metadata,
      });

      // 6. Increment the merchant's derivation index
      await Merchant.findByIdAndUpdate(merchant._id, {
        derivationIndex: nextIndex,
      });

      // 7. SaaS Automation: Subscribe to the derived address in Tatum
      if (process.env.PUBLIC_URL) {
        const tatumWebhookUrl = `${process.env.PUBLIC_URL}/v1/webhooks/tatum`;
        const subId = await TatumProvider.subscribeAddress(
          payAddress,
          currency,
          tatumWebhookUrl,
        );

        if (subId) {
          await Invoice.findByIdAndUpdate(invoice._id, {
            $set: { tatumSubscriptionId: subId },
          });
        }
      }

      server.log.info(`🧾 Invoice created: ${invoiceId} for $${amount_usd}`);

      return reply.code(201).send({
        invoice_id: invoice.invoiceId,
        amount_usd: invoice.amountUsd,
        crypto_amount: invoice.cryptoAmount,
        crypto_currency: invoice.cryptoCurrency,
        pay_address: invoice.payAddress,
        status: invoice.status,
        fee_usd: invoice.feeUsd,
        fee_crypto: invoice.feeCrypto,
        required_confirmations: invoice.requiredConfirmations,
        expires_at: invoice.expiresAt.toISOString(),
        created_at: invoice.createdAt.toISOString(),
      });
    },
  );

  // ──────────────────────────────────────────────
  // GET /v1/invoices/:id — Get Invoice Status
  // ──────────────────────────────────────────────
  server.get<{ Params: { id: string } }>(
    "/v1/invoices/:id",
    async (request, reply) => {
      const { id } = request.params;

      const invoice = await Invoice.findOne({ invoiceId: id });

      if (!invoice) {
        return reply.code(404).send({ error: "Invoice not found" });
      }

      return {
        invoice_id: invoice.invoiceId,
        amount_usd: invoice.amountUsd,
        crypto_amount: invoice.cryptoAmount,
        crypto_currency: invoice.cryptoCurrency,
        pay_address: invoice.payAddress,
        status: invoice.status,
        confirmations: invoice.confirmations,
        fee_usd: invoice.feeUsd,
        fee_crypto: invoice.feeCrypto,
        required_confirmations: invoice.requiredConfirmations,
        tx_hash: invoice.txHash || null,
        expires_at: invoice.expiresAt.toISOString(),
        paid_at: invoice.paidAt?.toISOString() || null,
        created_at: invoice.createdAt.toISOString(),
      };
    },
  );

  // ──────────────────────────────────────────────
  // GET /v1/invoices — List Invoices (Merchant-Scoped)
  // ──────────────────────────────────────────────
  server.get("/v1/invoices", async (request, reply) => {
    // Force-cast to access the attached merchant from preHandler
    const merchant = (request as any).merchant;

    if (!merchant) {
      return reply.code(401).send({ error: "Authentication required" });
    }

    const {
      status,
      page = "1",
      limit = "20",
    } = request.query as {
      status?: string;
      page?: string;
      limit?: string;
    };

    const filter: Record<string, unknown> = { merchantId: merchant._id };
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Invoice.countDocuments(filter),
    ]);

    return {
      data: invoices.map((inv) => ({
        invoice_id: inv.invoiceId,
        amount_usd: inv.amountUsd,
        crypto_amount: inv.cryptoAmount,
        crypto_currency: inv.cryptoCurrency,
        status: inv.status,
        confirmations: inv.confirmations,
        required_confirmations: inv.requiredConfirmations,
        tx_hash: inv.txHash || null,
        expires_at: inv.expiresAt.toISOString(),
        paid_at: inv.paidAt?.toISOString() || null,
        created_at: inv.createdAt.toISOString(),
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    };
  });

  // ──────────────────────────────────────────────
  // POST /v1/invoices/:id/cancel — Cancel Invoice
  // ──────────────────────────────────────────────
  server.post<{ Params: { id: string } }>(
    "/v1/invoices/:id/cancel",
    async (request, reply) => {
      const merchant = (request as any).merchant;
      const { id } = request.params;

      const invoice = await Invoice.findOne({
        invoiceId: id,
        merchantId: merchant._id,
      });

      if (!invoice) {
        return reply.code(404).send({ error: "Invoice not found" });
      }

      if (invoice.status !== "pending") {
        return reply.code(409).send({
          error: `Cannot cancel invoice with status '${invoice.status}'`,
        });
      }

      await Invoice.findByIdAndUpdate(invoice._id, {
        $set: { status: "expired" },
      });

      server.log.info(`🚫 Invoice cancelled: ${id}`);

      return { invoice_id: id, status: "expired", cancelled: true };
    },
  );
}
