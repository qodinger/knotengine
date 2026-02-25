import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { Invoice, Merchant, IInvoice, User } from "@qodinger/knot-database";
import { Derivator } from "@qodinger/knot-crypto";
import { PriceOracle } from "../infra/price-feed.js";
import { ConfirmationEngine } from "../core/confirmation-engine.js";
import { Currency, SUPPORTED_CURRENCIES } from "@qodinger/knot-types";
import { BlockchainProviderPool } from "../infra/provider-pool.js";
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
  // ──────────────────────────────────────────────
  // Middleware: Auth (API Key OR Internal Proxy)
  // ──────────────────────────────────────────────
  server.addHook("preHandler", async (request, reply) => {
    // Skip auth for public invoice status check
    if (
      request.method === "GET" &&
      request.url.match(/^\/v1\/invoices\/inv_/)
    ) {
      return;
    }

    // 1. Try API Key Auth (External)
    const apiKey = request.headers["x-api-key"] as string;
    if (apiKey) {
      const apiKeyHash = crypto
        .createHash("sha256")
        .update(apiKey)
        .digest("hex");
      const merchant = await Merchant.findOne({ apiKeyHash, isActive: true });
      if (merchant) {
        request.merchant = merchant;
        return;
      }
      return reply.code(401).send({ error: "Invalid API key" });
    }

    // 2. Try Internal Proxy Auth (Dashboard)
    const oauthId = request.headers["x-oauth-id"] as string;
    const internalSecret = request.headers["x-internal-secret"] as string;
    const merchantId = request.headers["x-merchant-id"] as string;

    if (oauthId && internalSecret === process.env.INTERNAL_SECRET) {
      const query: Record<string, unknown> = {
        oauthId: { $regex: new RegExp(`^${oauthId}(:|$)`) },
        isActive: true,
      };
      if (merchantId) {
        // Support both new public mid_... format and legacy MongoDB _id
        if (merchantId.startsWith("mid_")) {
          query.merchantId = merchantId;
        } else {
          query._id = merchantId;
        }
      }

      const merchant = await Merchant.findOne(query);
      if (merchant) {
        request.merchant = merchant;
        return;
      }
      return reply.code(401).send({ error: "Merchant not found" });
    }

    return reply.code(401).send({ error: "Unauthorized" });
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
          currency: z.enum(SUPPORTED_CURRENCIES),
          /** Invoice TTL in minutes (optional, falls back to merchant setting) */
          ttl_minutes: z.number().int().min(15).max(1440).optional(),
          metadata: z.record(z.unknown()).optional(),
          description: z.string().max(255).optional(),
          is_testnet: z.boolean().optional(),
        }),
      },
    },
    async (request, reply) => {
      try {
        const merchant = request.merchant;
        if (!merchant) return reply.code(401).send({ error: "Unauthorized" });
        const {
          amount_usd,
          currency,
          ttl_minutes,
          metadata,
          description,
          is_testnet,
        } = request.body;

        // 1. Get real-time crypto price
        const marketPrice = await PriceOracle.getPrice(currency as Currency);

        // Determine network context: is it a testnet invoice?
        const isTestnet = is_testnet === true;

        // Transparent Pricing: Customer pays exact market rate
        // No hidden spreads or recapture mechanics
        const customerPrice = marketPrice;

        const cryptoAmount = parseFloat(
          (amount_usd / customerPrice).toFixed(8),
        );

        // 2. Derive a unique payment address
        const nextIndex = merchant.derivationIndex + 1;
        let payAddress: string;

        const envNetwork =
          (process.env.BITCOIN_NETWORK as "bitcoin" | "testnet" | "regtest") ||
          "bitcoin";

        // Safety Rail: Only BTC, LTC, ETH and USDT supported on Testnet
        if (isTestnet && !SUPPORTED_CURRENCIES.includes(currency)) {
          return reply.code(400).send({
            error: `Testnet is currently only supported for: ${SUPPORTED_CURRENCIES.join(", ")}.`,
          });
        }

        try {
          if (currency === "BTC" || currency === "LTC") {
            const xpub = isTestnet ? merchant.btcXpubTestnet : merchant.btcXpub;

            if (!xpub) {
              return reply.code(400).send({
                error: `Merchant has no ${currency} ${isTestnet ? "Testnet" : "Mainnet"} xPub configured.`,
              });
            }

            // Map currency and testnet flag to internal network name
            let targetNetwork:
              | "bitcoin"
              | "testnet"
              | "litecoin"
              | "litecoin-testnet";
            if (currency === "BTC") {
              targetNetwork = isTestnet ? "testnet" : "bitcoin";
            } else {
              targetNetwork = isTestnet ? "litecoin-testnet" : "litecoin";
            }

            payAddress = Derivator.deriveUTXOAddress(
              xpub,
              nextIndex,
              targetNetwork,
            );
          } else {
            const ethXpub = isTestnet
              ? merchant.ethXpubTestnet
              : merchant.ethXpub;
            const ethStaticAddr = isTestnet
              ? merchant.ethAddressTestnet
              : merchant.ethAddress;

            if (ethXpub) {
              payAddress = Derivator.deriveEthereumAddress(ethXpub, nextIndex);
            } else if (ethStaticAddr) {
              payAddress = ethStaticAddr;
            } else {
              return reply.code(400).send({
                error: `Merchant has no ETH ${isTestnet ? "Testnet" : "Mainnet"} configuration.`,
              });
            }
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          server.log.error(`Address derivation error: ${message}`);
          return reply.code(400).send({
            error: `Invalid xPub or address configuration: ${message}`,
          });
        }

        // 3. Safety Rails: Minimum Invoice Amount
        const minInvoiceAmount = parseFloat(
          process.env.MIN_INVOICE_AMOUNT || "1.00",
        );
        if (amount_usd < minInvoiceAmount) {
          return reply.code(400).send({
            error: `Minimum invoice amount is $${minInvoiceAmount.toFixed(2)}`,
          });
        }

        // 4. Credit Balance Gate
        const user = merchant.userId
          ? await User.findById(merchant.userId)
          : null;
        if (!isTestnet && (!user || user.creditBalance <= 0)) {
          return reply.code(402).send({
            error:
              "Insufficient credit balance. Please top up your account to continue creating invoices.",
            creditBalance: user?.creditBalance || 0,
            topUpWallets: {
              EVM_STABLECOIN: process.env.PLATFORM_FEE_WALLET_EVM || null,
            },
          });
        }

        // 5. Get required confirmations
        const requiredConfirmations =
          await ConfirmationEngine.getRequiredConfirmations(
            merchant._id.toString(),
            currency,
          );

        // 5. Generate unique invoice ID
        const invoiceId = `inv_${crypto.randomBytes(12).toString("hex")}`;

        // 6. Calculate Fees and Totals
        // Determine the rate based on the plan: Starter: 1.5%, Pro: 0.75%, Enterprise: 0.5%
        const planRates: Record<string, number> = {
          starter: 0.015,
          professional: 0.0075,
          enterprise: 0.005,
        };

        const activeFeeRate = planRates[merchant.plan] || 0.015;
        const minFeeUsd = parseFloat(process.env.MIN_FEE_USD || "0.05");

        let feeUsd = 0;
        let feeCrypto = 0;
        let totalAmountUsd = amount_usd;
        let totalCryptoAmount = cryptoAmount;

        if (!isTestnet) {
          // A. Calculate Base Platform Fee
          const rawBaseFeeUsd = amount_usd * activeFeeRate;
          feeUsd = parseFloat(Math.max(rawBaseFeeUsd, minFeeUsd).toFixed(2));

          // B. Calculate Final Crypto Amount (customer pays exact invoice amount)
          totalCryptoAmount = cryptoAmount;
          totalAmountUsd = amount_usd;

          // C. Fee is deducted from merchant's credit balance (transparent)
          // No spread recapture - merchant receives 100% of invoice value on-chain

          // feeCrypto is just for tracking/display relative to the payment
          feeCrypto = parseFloat(
            ((feeUsd / amount_usd) * totalCryptoAmount).toFixed(8),
          );
        }

        // 7. Create the invoice
        const expirationMinutes =
          ttl_minutes || merchant.invoiceExpirationMinutes || 30;
        const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

        const invoice = await Invoice.create({
          merchantId: merchant._id,
          invoiceId,
          amountUsd: totalAmountUsd,
          cryptoAmount: totalCryptoAmount,
          cryptoCurrency: currency,
          payAddress,
          feeUsd, // Platform internal tracking
          feeCrypto,
          derivationIndex: nextIndex,
          requiredConfirmations,
          expiresAt,
          description,
          metadata: {
            ...metadata,
            network: envNetwork,
            isTestnet,
            baseAmountUsd: amount_usd, // Track base amount for transparency
            feeResponsibility: merchant.feeResponsibility || "merchant",
          },
        });

        // 8. Update derivation index on merchant (UTXO assets only)
        if (currency === "BTC" || currency === "LTC") {
          await Merchant.findByIdAndUpdate(merchant._id, {
            $set: { derivationIndex: nextIndex },
          });
        }

        server.log.info(
          `[Invoice] Created ${invoiceId} for ${merchant.name} (Address: ${payAddress})`,
        );

        const checkoutBaseUrl =
          process.env.CHECKOUT_BASE_URL || "http://localhost:5051";
        const checkoutUrl = `${checkoutBaseUrl}/checkout/${invoice.invoiceId}`;

        return reply.code(201).send({
          invoice_id: invoice.invoiceId,
          amount_usd: invoice.amountUsd,
          crypto_amount: invoice.cryptoAmount,
          crypto_currency: invoice.cryptoCurrency,
          pay_address: invoice.payAddress,
          expires_at: invoice.expiresAt,
          status: invoice.status,
          checkout_url: checkoutUrl,
          is_testnet: isTestnet,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return reply.code(500).send({
          error: `Failed to create invoice: ${message}`,
        });
      }
    },
  );

  // ──────────────────────────────────────────────
  // GET /v1/invoices/:id — Get Invoice Status
  // ──────────────────────────────────────────────
  server.get<{ Params: { id: string } }>(
    "/v1/invoices/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params;

      const invoice = await Invoice.findOne({ invoiceId: id }).populate<{
        merchantId: {
          name: string;
          logoUrl?: string;
          returnUrl?: string;
          bip21Enabled: boolean;
          plan: string;
        };
      }>("merchantId", "name logoUrl returnUrl bip21Enabled plan");

      if (!invoice) {
        return reply.code(404).send({ error: "Invoice not found" });
      }

      // ON-DEMAND MONITORING: Only subscribe if the invoice is being viewed and is still pending
      const now = new Date();
      const cooldownMs = 5 * 60 * 1000; // 5 minutes
      const isCoolingDown =
        invoice.lastMonitoringAttempt &&
        now.getTime() - invoice.lastMonitoringAttempt.getTime() < cooldownMs;

      if (
        invoice.status === "pending" &&
        !invoice.tatumSubscriptionId &&
        !isCoolingDown &&
        process.env.PUBLIC_URL
      ) {
        // Atomic update to mark attempt and prevent race conditions
        Invoice.findByIdAndUpdate(invoice._id, {
          $set: { lastMonitoringAttempt: now },
          $inc: { monitoringAttempts: 1 },
        }).exec();

        const tatumWebhookUrl = `${process.env.PUBLIC_URL}/v1/webhooks/tatum`;
        const useDualProvider =
          invoice.merchantId.plan === "professional" ||
          invoice.merchantId.plan === "enterprise";

        BlockchainProviderPool.getInstance()
          .subscribeAddress(
            invoice.payAddress,
            invoice.cryptoCurrency,
            tatumWebhookUrl,
            useDualProvider,
          )
          .then((result) => {
            if (result) {
              Invoice.findByIdAndUpdate(invoice._id, {
                $set: {
                  tatumSubscriptionId: result.subscriptionId,
                  providerName: result.providerName,
                },
              }).exec();
            }
          });
      }

      return {
        invoice_id: invoice.invoiceId,
        amount_usd: invoice.amountUsd,
        crypto_amount: invoice.cryptoAmount,
        crypto_amount_received: parseFloat(
          (invoice.cryptoAmountReceived || 0).toFixed(8),
        ),
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
        metadata: invoice.metadata,
        description: invoice.description || null,
        checkout_url: `${process.env.CHECKOUT_BASE_URL || "http://localhost:5051"}/checkout/${invoice.invoiceId}`,
        merchant: {
          name: invoice.merchantId.name,
          logo_url: invoice.merchantId.logoUrl || null,
          return_url: invoice.merchantId.returnUrl || null,
          bip21_enabled: invoice.merchantId.bip21Enabled ?? true,
        },
      };
    },
  );

  // ──────────────────────────────────────────────
  // GET /v1/invoices — List Invoices (Merchant-Scoped)
  // ──────────────────────────────────────────────
  server.get("/v1/invoices", async (request, reply) => {
    // Rely on type augmentation for the attached merchant from preHandler
    const merchant = request.merchant;

    if (!merchant) {
      return reply.code(401).send({ error: "Authentication required" });
    }

    const {
      status,
      include_testnet = "false",
      only_testnet = "false",
      page = "1",
      limit = "20",
    } = request.query as {
      status?: string;
      include_testnet?: string;
      only_testnet?: string;
      page?: string;
      limit?: string;
    };

    const filter: Record<string, unknown> = { merchantId: merchant._id };
    if (status) {
      filter.status = status;
    }
    if (only_testnet === "true") {
      // Exclusively testnet invoices
      filter["metadata.isTestnet"] = true;
    } else if (include_testnet !== "true") {
      // Default: exclude testnet invoices
      filter["metadata.isTestnet"] = { $ne: true };
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
        crypto_amount_received: parseFloat(
          (inv.cryptoAmountReceived || 0).toFixed(8),
        ),
        crypto_currency: inv.cryptoCurrency,
        pay_address: inv.payAddress,
        status: inv.status,
        confirmations: inv.confirmations,
        required_confirmations: inv.requiredConfirmations,
        tx_hash: inv.txHash || null,
        expires_at: inv.expiresAt.toISOString(),
        paid_at: inv.paidAt?.toISOString() || null,
        created_at: inv.createdAt.toISOString(),
        metadata: inv.metadata,
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
      const merchant = request.merchant;
      if (!merchant) return reply.code(401).send({ error: "Unauthorized" });
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

  // ──────────────────────────────────────────────
  // POST /v1/invoices/:id/resolve — Manual Resolve
  // ──────────────────────────────────────────────
  server.post<{ Params: { id: string } }>(
    "/v1/invoices/:id/resolve",
    async (request, reply) => {
      const merchant = request.merchant;
      if (!merchant) return reply.code(401).send({ error: "Unauthorized" });
      const { id } = request.params;

      const invoice = await Invoice.findOne({
        invoiceId: id,
        merchantId: merchant._id,
      });

      if (!invoice) {
        return reply.code(404).send({ error: "Invoice not found" });
      }

      if (["confirmed", "overpaid"].includes(invoice.status)) {
        return reply.code(409).send({
          error: `Invoice is already in a completed state (${invoice.status}).`,
        });
      }

      // Manual Resolution Logic
      const updateData: Partial<IInvoice> = {
        status: "confirmed",
        paidAt: new Date(),
        cryptoAmountReceived: invoice.cryptoAmount,
      };

      await Invoice.findByIdAndUpdate(invoice._id, { $set: updateData });

      // Emit socket update for real-time frontend reactivity
      const SocketService = (await import("../infra/socket-service.js"))
        .SocketService;
      SocketService.emitStatusUpdate(invoice.invoiceId, "confirmed", {
        cryptoAmountReceived: invoice.cryptoAmount,
      });

      // Trigger standard confirmation side-effects
      const WebhookDispatcher = (await import("../infra/webhook-dispatcher.js"))
        .WebhookDispatcher;
      WebhookDispatcher.dispatch(invoice.invoiceId, "invoice.confirmed");

      // Deduct Fees (since the merchant has "accepted" this payment)
      if (!invoice.metadata?.isTestnet) {
        await Merchant.findByIdAndUpdate(invoice.merchantId, {
          $inc: {
            "feesAccrued.usd": invoice.feeUsd,
            [`feesAccrued.${invoice.cryptoCurrency}`]: invoice.feeCrypto,
          },
        });

        if (merchant.userId) {
          await User.findByIdAndUpdate(merchant.userId, {
            $inc: { creditBalance: -invoice.feeUsd },
          });
        }
      }

      const NotificationService = (
        await import("../infra/notification-service.js")
      ).NotificationService;
      await NotificationService.create({
        merchantId: invoice.merchantId.toString(),
        title: invoice.metadata?.isTestnet
          ? "[TEST] Invoice Manually Resolved"
          : "Invoice Manually Resolved",
        description: `You have manually marked invoice ${invoice.invoiceId} as paid.`,
        type: "success",
        link: "/dashboard/payments",
        meta: {
          invoiceId: invoice.invoiceId,
          isTestnet: invoice.metadata?.isTestnet,
        },
      });

      server.log.info(`✅ Invoice manually resolved: ${id}`);

      return { invoice_id: id, status: "confirmed", resolved: true };
    },
  );
}
