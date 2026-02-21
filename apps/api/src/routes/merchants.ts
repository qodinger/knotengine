import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  Merchant,
  Invoice,
  TopUpClaim,
  Notification,
} from "@qodinger/knot-database";

import * as crypto from "crypto";
import { TatumProvider } from "../infra/tatum-provider";
import { TxVerifier } from "../infra/tx-verifier";
import { PriceOracle } from "../infra/price-feed";
import * as bip39 from "bip39";
import { BIP32Factory } from "bip32";
import * as ecc from "tiny-secp256k1";
import * as bitcoin from "bitcoinjs-lib";
import { ethers } from "ethers";
import { SUPPORTED_CURRENCIES } from "@qodinger/knot-types";
import { WebhookDispatcher } from "../infra/webhook-dispatcher";

const bip32 = BIP32Factory(ecc);

export async function merchantRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post(
    "/v1/merchants",
    {
      schema: {
        body: z.object({
          name: z.string().min(0).optional(),
          email: z.string().email().optional(),
          btcXpub: z.string().optional(),
          btcXpubTestnet: z.string().optional(),
          ethAddress: z.string().optional(),
          ethAddressTestnet: z.string().optional(),
          webhookUrl: z.string().url().optional(),
          oauthId: z.string().optional(), // OAuth identity e.g. 'google:12345'
        }),
      },
    },
    async (request, reply) => {
      const {
        name,
        email,
        btcXpub,
        btcXpubTestnet,
        ethAddress,
        ethAddressTestnet,
        webhookUrl,
        oauthId,
      } = request.body;

      // Security: Creating a merchant for an OAuth user requires internal privilege
      if (oauthId) {
        const secret = request.headers["x-internal-secret"];
        if (secret !== process.env.INTERNAL_SECRET) {
          return reply
            .code(403)
            .send({ error: "Forbidden: Internal Secret Required" });
        }
      }

      const webhookSecret = `knot_wh_${crypto.randomBytes(24).toString("hex")}`;

      let apiKey: string | undefined;
      let apiKeyHash: string | undefined;

      // Only generate an API key for direct (non-OAuth) registrations
      if (!oauthId) {
        apiKey = `knot_sk_${crypto.randomBytes(24).toString("hex")}`;
        apiKeyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
      }

      // Append timestamp to invoke uniqueness for multi-store support
      const uniqueOauthId = oauthId ? `${oauthId}:${Date.now()}` : undefined;

      const welcomeCredit = parseFloat(
        process.env.WELCOME_CREDIT_AMOUNT || "5.00",
      );

      let finalBtcXpubTestnet = btcXpubTestnet;
      let finalEthAddressTestnet = ethAddressTestnet;

      if (!finalBtcXpubTestnet || !finalEthAddressTestnet) {
        const mnemonic = bip39.generateMnemonic();
        const seed = await bip39.mnemonicToSeed(mnemonic);

        const root = bip32.fromSeed(seed, bitcoin.networks.testnet);
        const btcNode = root.derivePath("m/84'/1'/0'");
        finalBtcXpubTestnet =
          finalBtcXpubTestnet || btcNode.neutered().toBase58();

        const ethWallet = ethers.Wallet.fromPhrase(mnemonic);
        finalEthAddressTestnet = finalEthAddressTestnet || ethWallet.address;
      }

      const newMerchant = await Merchant.create({
        name,
        email,
        apiKeyHash,
        oauthId: uniqueOauthId,
        btcXpub,
        btcXpubTestnet: finalBtcXpubTestnet,
        ethAddress,
        ethAddressTestnet: finalEthAddressTestnet,
        webhookUrl,
        webhookSecret,
        creditBalance: welcomeCredit,
      });

      server.log.info(`Merchant created: ${newMerchant.id}`);

      if (btcXpub && process.env.PUBLIC_URL) {
        const tatumWebhookUrl = `${process.env.PUBLIC_URL}/v1/webhooks/tatum`;
        await TatumProvider.subscribeMerchantXpub(btcXpub, tatumWebhookUrl);
      }

      return reply.code(201).send({
        id: newMerchant.id,
        name: newMerchant.name,
        email: newMerchant.email,
        webhookSecret,
        apiKey: apiKey ?? null, // null for OAuth merchants
      });
    },
  );

  // ──────────────────────────────────────────────
  // GET /v1/merchants/by-oauth/:oauthId — Internal OAuth lookup
  // Used by NextAuth to find an existing merchant by OAuth identity
  // ──────────────────────────────────────────────
  server.get(
    "/v1/merchants/by-oauth/:oauthId",
    async (request: FastifyRequest<{ Params: { oauthId: string } }>, reply) => {
      // Protect with internal secret
      const secret = request.headers["x-internal-secret"];
      if (secret !== process.env.INTERNAL_SECRET) {
        return reply.code(403).send({ error: "Forbidden" });
      }

      const { oauthId } = request.params;
      // Query using regex to find all stores matching this base oauthId prefix
      const merchants = await Merchant.find({
        oauthId: { $regex: new RegExp(`^${oauthId}(:|$)`) },
        isActive: true,
      }).sort({
        createdAt: 1,
      });

      if (merchants.length === 0) {
        return reply.code(404).send({ error: "Not found" });
      }

      const results = [];

      for (let merchant of merchants) {
        let apiKey: string | undefined;

        // Ensure every merchant has an API key
        if (!merchant.apiKeyHash) {
          apiKey = `knot_sk_${crypto.randomBytes(24).toString("hex")}`;
          const apiKeyHash = crypto
            .createHash("sha256")
            .update(apiKey)
            .digest("hex");

          const updatedMerchant = await Merchant.findByIdAndUpdate(
            merchant._id,
            { $set: { apiKeyHash } },
            { new: true },
          );
          if (!updatedMerchant) throw new Error("Failed to update merchant");
          merchant = updatedMerchant;

          server.log.info(
            `🔑 Auto-generated API key for OAuth merchant: ${merchant._id}`,
          );
        }

        results.push({
          id: merchant._id.toString(),
          name: merchant.name,
          email: merchant.email,
          apiKey: apiKey ?? null, // Will only be returned once if generated just now
          hasApiKey: true,
        });
      }

      return results;
    },
  );
  // ──────────────────────────────────────────────
  // Middleware: API Key Authentication for me/ routes
  // ──────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const authHook = async (request: FastifyRequest, reply: FastifyReply) => {
    const apiKey = request.headers["x-api-key"] as string;

    if (!apiKey) {
      throw new Error("Missing API Key");
    }

    const apiKeyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
    const merchant = await Merchant.findOne({ apiKeyHash, isActive: true });

    if (!merchant) {
      return reply.code(401).send({ error: "Invalid API Key" });
    }

    // Attach to request
    request.merchant = merchant;
  };

  // ──────────────────────────────────────────────
  // Internal: OAuth session hook — authenticates via x-oauth-id header
  // Used by the dashboard's server actions (not exposed publicly)
  // ──────────────────────────────────────────────
  const oauthHook = async (request: FastifyRequest, reply: FastifyReply) => {
    const oauthId = request.headers["x-oauth-id"] as string;
    const merchantId = request.headers["x-merchant-id"] as string;
    const secret = request.headers["x-internal-secret"] as string;

    if (!oauthId || secret !== process.env.INTERNAL_SECRET) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const query: Record<string, unknown> = {
      oauthId: { $regex: new RegExp(`^${oauthId}(:|$)`) },
      isActive: true,
    };
    if (merchantId) {
      query._id = merchantId;
    }

    // If multiple merchants exist and no ID provided, this defaults to the first one found.
    // Ideally, dashboard should always send x-merchant-id.
    const merchant = await Merchant.findOne(query);

    if (!merchant) {
      return reply.code(401).send({ error: "Merchant not found" });
    }

    request.merchant = merchant;
  };

  // ──────────────────────────────────────────────
  // Middleware: Unified Auth (API Key OR Internal OAuth)
  // ──────────────────────────────────────────────
  const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    const apiKey = request.headers["x-api-key"];
    if (apiKey) {
      try {
        await authHook(request, reply);
      } catch {
        return reply.code(401).send({ error: "Invalid API Key" });
      }
    } else {
      await oauthHook(request, reply);
    }
  };

  // ──────────────────────────────────────────────
  // GET /v1/merchants/me — Get Profile
  // ──────────────────────────────────────────────
  server.get(
    "/v1/merchants/me",
    { preHandler: requireAuth },
    async (request, reply) => {
      const merchant = request.merchant;
      if (!merchant) return reply.code(500).send({ error: "Auth failed" });

      return {
        id: merchant._id.toString(),
        name: merchant.name,
        btcXpub: merchant.btcXpub,
        btcXpubTestnet: merchant.btcXpubTestnet,
        ethAddress: merchant.ethAddress,
        ethAddressTestnet: merchant.ethAddressTestnet,
        webhookUrl: merchant.webhookUrl,
        webhookSecret: merchant.webhookSecret,
        logoUrl: merchant.logoUrl,
        returnUrl: merchant.returnUrl,
        enabledCurrencies: merchant.enabledCurrencies || [],
        webhookEvents: merchant.webhookEvents || [
          "invoice.confirmed",
          "invoice.mempool_detected",
          "invoice.failed",
        ],
        confirmationPolicy: merchant.confirmationPolicy,
        feesAccrued: merchant.feesAccrued,
        creditBalance: merchant.creditBalance,
        createdAt: merchant.createdAt,
      };
    },
  );

  // ──────────────────────────────────────────────
  // DELETE /v1/merchants/me — Delete Profile
  // ──────────────────────────────────────────────
  server.delete(
    "/v1/merchants/me",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      const merchant = request.merchant;
      if (!merchant) return reply.code(500).send({ error: "Auth failed" });

      await Merchant.findByIdAndDelete(merchant._id);

      server.log.info(`[Settings] Deleted merchant: '${merchant._id}'`);

      return {
        success: true,
        message: "Store deleted successfully",
      };
    },
  );

  // ──────────────────────────────────────────────
  // PATCH /v1/merchants/me — Update Profile
  // ──────────────────────────────────────────────
  server.patch(
    "/v1/merchants/me",
    {
      preHandler: requireAuth,
      schema: {
        body: z.object({
          name: z.string().min(0).optional(),
          btcXpub: z.string().nullable().optional(),
          btcXpubTestnet: z.string().nullable().optional(),
          ethAddress: z.string().nullable().optional(),
          ethAddressTestnet: z.string().nullable().optional(),
          webhookUrl: z.string().url().nullable().optional(),
          webhookEvents: z.array(z.string()).optional(),
          logoUrl: z.string().nullable().optional(),
          returnUrl: z.string().nullable().optional(),
          confirmationPolicy: z
            .object({
              BTC: z.number().int().min(0),
              LTC: z.number().int().min(0),
              ETH: z.number().int().min(0),
            })
            .optional(),
          enabledCurrencies: z.array(z.string()).optional(),
        }),
      },
    },
    async (request, reply) => {
      const merchant = request.merchant;
      if (!merchant) return reply.code(500).send({ error: "Auth failed" });

      const updates = request.body;

      server.log.info(
        `[Settings] RAW updates received: ${JSON.stringify(updates)}`,
      );

      const updated = await Merchant.findByIdAndUpdate(
        merchant._id,
        { $set: updates },
        { new: true },
      );

      if (!updated) {
        return reply.code(500).send({ error: "Failed to update merchant" });
      }

      server.log.info(`[Settings] Updated DB result name: '${updated?.name}'`);

      return {
        id: updated._id.toString(),
        name: updated.name,
        btcXpub: updated.btcXpub,
        btcXpubTestnet: updated.btcXpubTestnet,
        ethAddress: updated.ethAddress,
        ethAddressTestnet: updated.ethAddressTestnet,
        webhookUrl: updated.webhookUrl,
        webhookSecret: updated.webhookSecret,
        enabledCurrencies: updated.enabledCurrencies,
        logoUrl: updated.logoUrl,
        returnUrl: updated.returnUrl,
        webhookEvents: updated.webhookEvents || [
          "invoice.confirmed",
          "invoice.mempool_detected",
          "invoice.failed",
        ],
        confirmationPolicy: updated.confirmationPolicy,
      };
    },
  );

  // ──────────────────────────────────────────────
  // POST /v1/merchants/me/webhooks/test — Dispatch Test Webhook
  // ──────────────────────────────────────────────
  server.post(
    "/v1/merchants/me/webhooks/test",
    { preHandler: requireAuth },
    async (request, reply) => {
      const merchant = request.merchant;
      if (!merchant) return reply.code(500).send({ error: "Auth failed" });

      try {
        await WebhookDispatcher.dispatchTest(merchant._id.toString());
        return {
          success: true,
          message: "Test webhook dispatched successfully",
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        server.log.error(`❌ Failed to send webhook: ${message}`);
        return reply.code(400).send({ error: message });
      }
    },
  );

  // ──────────────────────────────────────────────
  // POST /v1/merchants/me/keys/generate — Generate First API Key (OAuth merchants)
  // ──────────────────────────────────────────────
  server.post(
    "/v1/merchants/me/keys/generate",
    { preHandler: requireAuth },
    async (request, reply) => {
      const merchant = request.merchant;
      if (!merchant) return reply.code(401).send({ error: "Unauthorized" });

      if (merchant.apiKeyHash) {
        return reply
          .code(400)
          .send({ error: "API key already exists. Use rotate instead." });
      }

      const newApiKey = `knot_sk_${crypto.randomBytes(24).toString("hex")}`;
      const newApiKeyHash = crypto
        .createHash("sha256")
        .update(newApiKey)
        .digest("hex");

      await Merchant.findByIdAndUpdate(merchant._id, {
        $set: { apiKeyHash: newApiKeyHash },
      });

      server.log.info(`🔑 API Key generated for merchant: ${merchant._id}`);

      return reply.code(201).send({
        message: "API Key generated successfully.",
        apiKey: newApiKey,
      });
    },
  );

  // ──────────────────────────────────────────────
  // POST /v1/merchants/me/keys — Rotate Key (API key auth)
  // ──────────────────────────────────────────────
  server.post(
    "/v1/merchants/me/keys",
    { preHandler: requireAuth },
    async (request, reply) => {
      const merchant = request.merchant;
      if (!merchant) return reply.code(401).send({ error: "Unauthorized" });

      // Generate new key
      const newApiKey = `knot_sk_${crypto.randomBytes(24).toString("hex")}`;
      const newApiKeyHash = crypto
        .createHash("sha256")
        .update(newApiKey)
        .digest("hex");

      await Merchant.findByIdAndUpdate(merchant._id, {
        $set: { apiKeyHash: newApiKeyHash },
      });

      server.log.warn(`⚠️ API Key rotated for merchant: ${merchant._id}`);

      return reply.code(200).send({
        message: "API Key rotated successfully. Old key is now invalid.",
        apiKey: newApiKey,
      });
    },
  );

  // ──────────────────────────────────────────────
  // POST /v1/merchants/me/keys/webhook — Rotate Webhook Secret
  // ──────────────────────────────────────────────
  server.post(
    "/v1/merchants/me/keys/webhook",
    { preHandler: requireAuth },
    async (request, reply) => {
      const merchant = request.merchant;
      if (!merchant) return reply.code(401).send({ error: "Unauthorized" });

      // Generate new secret
      const newWebhookSecret = `knot_wh_${crypto
        .randomBytes(24)
        .toString("hex")}`;

      await Merchant.findByIdAndUpdate(merchant._id, {
        $set: { webhookSecret: newWebhookSecret },
      });

      server.log.warn(
        `⚠️ Webhook Secret rotated for merchant: ${merchant._id}`,
      );

      return reply.code(200).send({
        message: "Webhook Secret rotated successfully.",
        webhookSecret: newWebhookSecret,
      });
    },
  );

  // ──────────────────────────────────────────────
  // GET /v1/merchants/me/stats — Dashboard Stats
  // ──────────────────────────────────────────────
  server.get(
    "/v1/merchants/me/stats",
    {
      preHandler: requireAuth,
      schema: {
        querystring: z.object({
          period: z.enum(["24h", "7d", "30d"]).default("7d"),
        }),
      },
    },
    async (request, reply) => {
      const merchant = request.merchant;
      if (!merchant) return reply.code(401).send({ error: "Unauthorized" });

      const { period } = request.query as { period: string };

      const [totalInvoices, confirmedInvoicesResult, testnetInvoicesResult] =
        await Promise.all([
          Invoice.countDocuments({
            merchantId: merchant._id,
            "metadata.isTestnet": { $ne: true },
          }) as unknown as number,
          Invoice.aggregate<{ _id: null; total: number }>([
            {
              $match: {
                merchantId: merchant._id,
                status: "confirmed",
                "metadata.isTestnet": { $ne: true },
              },
            },
            { $group: { _id: null, total: { $sum: "$amountUsd" } } },
          ]),
          Invoice.aggregate<{ _id: null; total: number; count: number }>([
            {
              $match: {
                merchantId: merchant._id,
                status: "confirmed",
                "metadata.isTestnet": true,
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: "$amountUsd" },
                count: { $sum: 1 },
              },
            },
          ]),
        ]);

      const totalVolume =
        confirmedInvoicesResult.length > 0
          ? confirmedInvoicesResult[0].total
          : 0;

      const testnetVolume =
        testnetInvoicesResult.length > 0 ? testnetInvoicesResult[0].total : 0;
      const testnetInvoicesCount =
        testnetInvoicesResult.length > 0 ? testnetInvoicesResult[0].count : 0;

      const confirmedInvoicesCount = await Invoice.countDocuments({
        merchantId: merchant._id,
        status: "confirmed",
        "metadata.isTestnet": { $ne: true },
      });

      const successRate =
        totalInvoices > 0
          ? ((confirmedInvoicesCount / totalInvoices) * 100).toFixed(1)
          : "0";

      // ──────────────────────────────────────────────
      // Chart Data Aggregation
      // ──────────────────────────────────────────────
      const now = new Date();
      let startTime: Date;
      let groupBy: any;
      let format: (date: Date) => string;

      if (period === "24h") {
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        groupBy = {
          $dateToString: { format: "%Y-%m-%d %H:00", date: "$createdAt" },
        };
        format = (d) =>
          d.toLocaleTimeString([], { hour: "2-digit", hour12: false }) + ":00";
      } else if (period === "30d") {
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        format = (d) =>
          d.toLocaleDateString([], { month: "short", day: "numeric" });
      } else {
        // default 7d
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        format = (d) => d.toLocaleDateString([], { weekday: "short" });
      }

      const rawChartData = await Invoice.aggregate([
        {
          $match: {
            merchantId: merchant._id,
            status: "confirmed",
            "metadata.isTestnet": { $ne: true },
            createdAt: { $gte: startTime },
          },
        },
        {
          $group: {
            _id: groupBy,
            volume: { $sum: "$amountUsd" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Fill in zeros for missing periods to ensure smooth chart
      const chartData: { name: string; volume: number }[] = [];
      const steps = period === "24h" ? 24 : period === "30d" ? 30 : 7;
      const stepMs = period === "24h" ? 3600000 : 86400000;

      for (let i = 0; i < steps; i++) {
        const d = new Date(startTime.getTime() + i * stepMs);
        const key =
          period === "24h"
            ? d.toISOString().slice(0, 13) + ":00"
            : d.toISOString().slice(0, 10);

        const match = rawChartData.find((r) => r._id === key);
        chartData.push({
          name: format(d),
          volume: match ? parseFloat(match.volume.toFixed(2)) : 0,
        });
      }

      return {
        totalVolume,
        testnetVolume,
        testnetInvoicesCount,
        activeInvoices: totalInvoices,
        successRate: `${successRate}%`,
        chartData,
        feesAccrued: merchant.feesAccrued || { usd: 0 },
        creditBalance: merchant.creditBalance ?? 5.0,
        currentFeeRate: parseFloat(process.env.PLATFORM_FEE_RATE || "0.01"),
        platformFeeWallets: {
          BTC: process.env.PLATFORM_FEE_WALLET_BTC || null,
          LTC: process.env.PLATFORM_FEE_WALLET_LTC || null,
          EVM: process.env.PLATFORM_FEE_WALLET_EVM || null, // Shared for ETH/USDT
        },
      };
    },
  );

  // ──────────────────────────────────────────────
  // POST /v1/merchants/me/topup — Verify & Claim Top-Up Credits
  // ──────────────────────────────────────────────
  server.post(
    "/v1/merchants/me/topup",
    {
      preHandler: requireAuth,
      schema: {
        body: z.object({
          txHash: z.string().min(10),
          currency: z.enum(SUPPORTED_CURRENCIES),
        }),
      },
    },
    async (request, reply) => {
      const merchant = request.merchant;
      if (!merchant) return reply.code(401).send({ error: "Unauthorized" });

      const { txHash, currency } = request.body;

      try {
        // 1. Prevent double spend
        const existingClaim = await TopUpClaim.findOne({ txHash });
        if (existingClaim) {
          return reply.code(400).send({
            error: "Transaction has already been claimed for top-up credits.",
            status: existingClaim.status,
          });
        }

        // 2. Identify the expected platform wallet
        let expectedAddress = "";
        if (currency === "BTC") {
          expectedAddress = process.env.PLATFORM_FEE_WALLET_BTC || "";
        } else if (currency === "LTC") {
          expectedAddress = process.env.PLATFORM_FEE_WALLET_LTC || "";
        } else {
          expectedAddress = process.env.PLATFORM_FEE_WALLET_EVM || "";
        }

        if (!expectedAddress) {
          return reply.code(500).send({
            error: `Platform fee wallet for ${currency} is not configured.`,
          });
        }

        // 3. Verify on the blockchain
        const verification = await TxVerifier.verifyTx(
          txHash,
          currency,
          expectedAddress,
        );

        if (!verification.isValid || verification.amountCrypto <= 0) {
          return reply.code(400).send({
            error:
              "Transaction verification failed. Ensure the transaction is confirmed and sent to the correct platform address.",
          });
        }

        // 4. Calculate USD Value
        const usdPrice = await PriceOracle.getPrice(currency);
        const usdAmount = parseFloat(
          (verification.amountCrypto * usdPrice).toFixed(2),
        );

        // 5. Save the Claim and Update Merchant Balance in a transaction-like flow
        const claim = await TopUpClaim.create({
          merchantId: merchant._id,
          txHash,
          currency,
          amountCrypto: verification.amountCrypto,
          amountUsd: usdAmount,
          status: "approved",
        });

        await Merchant.findByIdAndUpdate(merchant._id, {
          $inc: { creditBalance: usdAmount },
        });

        // Fetch fresh state for response
        const updatedMerchant = await Merchant.findById(merchant._id);

        server.log.info(
          `🤑 Top-Up Claimed: ${merchant._id} +$${usdAmount} (${txHash})`,
        );

        return reply.send({
          success: true,
          addedUsd: usdAmount,
          newCreditBalance: updatedMerchant?.creditBalance,
          claimId: claim._id,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        server.log.error(`Topup Error: ${message}`);
        return reply.code(500).send({ error: "Internal top-up error" });
      }
    },
  );

  // ──────────────────────────────────────────────
  // GET /v1/merchants/me/notifications — Get Notifications
  // ──────────────────────────────────────────────
  server.get(
    "/v1/merchants/me/notifications",
    {
      preHandler: requireAuth,
      schema: {
        querystring: z.object({
          limit: z.coerce.number().int().min(1).max(100).default(20),
          offset: z.coerce.number().int().min(0).default(0),
          invoiceId: z.string().optional(),
        }),
      },
    },
    async (request, _reply) => {
      const merchant = request.merchant;
      if (!merchant) return _reply.code(401).send({ error: "Unauthorized" });

      const { limit, offset, invoiceId } = request.query;

      const query: Record<string, unknown> = {
        merchantId: merchant._id,
      };

      if (invoiceId) {
        query["meta.invoiceId"] = invoiceId;
      }

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit);

      const unreadCount = await Notification.countDocuments({
        merchantId: merchant._id,
        isRead: false,
      });

      return {
        data: notifications,
        unreadCount,
      };
    },
  );

  // ──────────────────────────────────────────────
  // PATCH /v1/merchants/me/notifications/mark-read — Mark all as read
  // ──────────────────────────────────────────────
  server.patch(
    "/v1/merchants/me/notifications/mark-read",
    {
      preHandler: requireAuth,
    },
    async (request, _reply) => {
      const merchant = request.merchant;
      if (!merchant) return _reply.code(401).send({ error: "Unauthorized" });

      await Notification.updateMany(
        { merchantId: merchant._id, isRead: false },
        { $set: { isRead: true } },
      );

      return { success: true };
    },
  );

  // ──────────────────────────────────────────────
  // PATCH /v1/merchants/me/notifications/:id — Mark one as read
  // ──────────────────────────────────────────────
  server.patch(
    "/v1/merchants/me/notifications/:id",
    {
      preHandler: requireAuth,
      schema: {
        params: z.object({
          id: z.string(),
        }),
      },
    },
    async (request, _reply) => {
      const merchant = request.merchant;
      if (!merchant) return _reply.code(401).send({ error: "Unauthorized" });

      const { id } = request.params;

      await Notification.findOneAndUpdate(
        { _id: id, merchantId: merchant._id },
        { $set: { isRead: true } },
      );

      return { success: true };
    },
  );

  // ──────────────────────────────────────────────
  // POST /v1/merchants/me/wallet/generate-testnet — Generate Testnet Wallet
  // ──────────────────────────────────────────────
  server.post(
    "/v1/merchants/me/wallet/generate-testnet",
    { preHandler: requireAuth },
    async (request, _reply) => {
      const merchant = request.merchant;
      if (!merchant) return _reply.code(401).send({ error: "Unauthorized" });

      // 1. Generate Mnemonic
      const mnemonic = bip39.generateMnemonic();
      const seed = await bip39.mnemonicToSeed(mnemonic);

      // 2. Derive BTC Testnet xPub (SegWit native - m/84'/1'/0')
      // Network: bitcoin.networks.testnet
      const root = bip32.fromSeed(seed, bitcoin.networks.testnet);
      const btcNode = root.derivePath("m/84'/1'/0'");
      const btcXpubTestnet = btcNode.neutered().toBase58();

      // 3. Derive ETH Address (m/44'/60'/0'/0/0)
      // Ethers handles this easily
      const ethWallet = ethers.Wallet.fromPhrase(mnemonic);
      const ethAddressTestnet = ethWallet.address;

      // 4. Update Merchant
      await Merchant.findByIdAndUpdate(merchant._id, {
        $set: {
          btcXpubTestnet,
          ethAddressTestnet,
        },
      });

      server.log.info(`Testnet wallet generated for merchant: ${merchant._id}`);

      return {
        message: "Testnet wallet generated successfully.",
        mnemonic,
        btcXpubTestnet,
        ethAddressTestnet,
      };
    },
  );
}
