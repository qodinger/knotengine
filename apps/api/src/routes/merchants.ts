/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { Merchant, Invoice } from "@knotengine/database";
import * as crypto from "crypto";
import { TatumProvider } from "../infra/tatum-provider";
import * as bip39 from "bip39";
import { BIP32Factory } from "bip32";
import * as ecc from "tiny-secp256k1";
import * as bitcoin from "bitcoinjs-lib";
import { ethers } from "ethers";

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

      const newMerchant = await Merchant.create({
        name,
        email,
        apiKeyHash,
        oauthId: uniqueOauthId,
        btcXpub,
        btcXpubTestnet,
        ethAddress,
        ethAddressTestnet,
        webhookUrl,
        webhookSecret,
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
  server.get("/v1/merchants/by-oauth/:oauthId", async (request: any, reply) => {
    // Protect with internal secret
    const secret = request.headers["x-internal-secret"];
    if (secret !== process.env.INTERNAL_SECRET) {
      return reply.code(403).send({ error: "Forbidden" });
    }

    const { oauthId } = request.params as { oauthId: string };
    // Query using regex to find all stores matching this base oauthId prefix
    const merchants = await Merchant.find({
      oauthId: { $regex: new RegExp(`^${oauthId}`) },
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

        merchant = (await Merchant.findByIdAndUpdate(
          merchant._id,
          { $set: { apiKeyHash } },
          { new: true },
        )) as any;

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
  });
  // ──────────────────────────────────────────────
  // Middleware: API Key Authentication for me/ routes
  // ──────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const authHook = async (request: any, reply: any) => {
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
  const oauthHook = async (request: any, reply: any) => {
    const oauthId = request.headers["x-oauth-id"] as string;
    const merchantId = request.headers["x-merchant-id"] as string;
    const secret = request.headers["x-internal-secret"] as string;

    if (!oauthId || secret !== process.env.INTERNAL_SECRET) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const query: any = {
      oauthId: { $regex: new RegExp(`^${oauthId}`) },
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
  const requireAuth = async (request: any, reply: any) => {
    const apiKey = request.headers["x-api-key"];
    if (apiKey) {
      try {
        await authHook(request, reply);
      } catch (e) {
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
      const merchant = (request as any).merchant;
      if (!merchant) return reply.code(500).send({ error: "Auth failed" });

      return {
        id: merchant._id,
        name: merchant.name,
        btcXpub: merchant.btcXpub,
        btcXpubTestnet: merchant.btcXpubTestnet,
        ethAddress: merchant.ethAddress,
        ethAddressTestnet: merchant.ethAddressTestnet,
        webhookUrl: merchant.webhookUrl,
        webhookSecret: merchant.webhookSecret,
        confirmationPolicy: merchant.confirmationPolicy,
        feesAccrued: merchant.feesAccrued,
        createdAt: merchant.createdAt,
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
          btcXpub: z.string().optional(),
          btcXpubTestnet: z.string().optional(),
          ethAddress: z.string().optional(),
          ethAddressTestnet: z.string().optional(),
          webhookUrl: z.string().url().optional(),
          confirmationPolicy: z
            .object({
              BTC: z.number().int().min(0),
              LTC: z.number().int().min(0),
              ETH: z.number().int().min(0),
            })
            .optional(),
        }),
      },
    },
    async (request) => {
      const merchant = (request as any).merchant;
      const updates = request.body;

      server.log.info(
        `[Settings] RAW updates received: ${JSON.stringify(updates)}`,
      );

      const updated = await Merchant.findByIdAndUpdate(
        merchant._id,
        { $set: updates },
        { new: true },
      );

      server.log.info(`[Settings] Updated DB result name: '${updated?.name}'`);

      return {
        id: updated!._id,
        name: updated!.name,
        btcXpub: updated!.btcXpub,
        btcXpubTestnet: updated!.btcXpubTestnet,
        ethAddress: updated!.ethAddress,
        ethAddressTestnet: updated!.ethAddressTestnet,
        webhookUrl: updated!.webhookUrl,
        webhookSecret: updated!.webhookSecret,
        confirmationPolicy: updated!.confirmationPolicy,
      };
    },
  );

  // ──────────────────────────────────────────────
  // POST /v1/merchants/me/keys/generate — Generate First API Key (OAuth merchants)
  // ──────────────────────────────────────────────
  server.post(
    "/v1/merchants/me/keys/generate",
    { preHandler: requireAuth },
    async (request, reply) => {
      const merchant = (request as any).merchant;

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
      const merchant = (request as any).merchant;

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
      const merchant = (request as any).merchant;

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
    },
    async (request) => {
      const merchant = (request as any).merchant;

      const [invoicesCount, confirmedInvoices] = await Promise.all([
        Invoice.countDocuments({ merchantId: merchant._id }),
        Invoice.find({ merchantId: merchant._id, status: "confirmed" }),
      ]);

      const totalVolume = confirmedInvoices.reduce(
        (sum: number, inv: any) => sum + inv.amountUsd,
        0,
      );
      const successRate =
        invoicesCount > 0
          ? ((confirmedInvoices.length / invoicesCount) * 100).toFixed(1)
          : "0";

      return {
        totalVolume,
        activeInvoices: invoicesCount,
        successRate: `${successRate}%`,
        chartData: [
          { name: "Mon", volume: 0 },
          { name: "Tue", volume: 0 },
          { name: "Wed", volume: totalVolume },
          { name: "Thu", volume: 0 },
          { name: "Fri", volume: 0 },
        ],
        feesAccrued: merchant.feesAccrued || { usd: 0 },
        currentFeeRate: parseFloat(process.env.PLATFORM_FEE_RATE || "0.005"),
      };
    },
  );

  // ──────────────────────────────────────────────
  // POST /v1/merchants/me/wallet/generate-testnet — Generate Testnet Wallet
  // ──────────────────────────────────────────────
  server.post(
    "/v1/merchants/me/wallet/generate-testnet",
    { preHandler: requireAuth },
    async (request, reply) => {
      const merchant = (request as any).merchant;

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
