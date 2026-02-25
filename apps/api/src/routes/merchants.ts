import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  Merchant,
  Invoice,
  TopUpClaim,
  Notification,
  User,
  PromoCode,
} from "@qodinger/knot-database";

import * as crypto from "crypto";
import { TxVerifier } from "../infra/tx-verifier.js";
import { PriceOracle } from "../infra/price-feed.js";
import * as bip39 from "bip39";
import { BIP32Factory } from "bip32";
import * as ecc from "tiny-secp256k1";
import * as bitcoin from "bitcoinjs-lib";
import { ethers } from "ethers";
import { SUPPORTED_CURRENCIES } from "@qodinger/knot-types";
import { WebhookDispatcher } from "../infra/webhook-dispatcher.js";
import { NotificationService } from "../infra/notification-service.js";
import { ipAllowlistMiddleware } from "../infra/ip-allowlist.js";
import { AuditLogger } from "../core/audit-logger.js";

const bip32 = BIP32Factory(ecc);

/**
 * 🆔 Generate a professional, short, prefixed public ID for merchants
 * e.g. mid_5kR9pWx2nL4v
 */
const generateMerchantId = async (): Promise<string> => {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let attempts = 0;

  while (attempts < 10) {
    const mid =
      "mid_" +
      Array.from(crypto.randomBytes(12))
        .map((b) => chars[b % chars.length])
        .join("");

    const exists = await Merchant.exists({ merchantId: mid });
    if (!exists) return mid;
    attempts++;
  }

  throw new Error("Failed to generate a unique merchant ID");
};

/**
 * 🎁 Generate a short, unique referral code for the merchant
 * e.g. REF_K7Q2
 */
const generateReferralCode = async (): Promise<string> => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let attempts = 0;

  while (attempts < 10) {
    const code =
      "REF_" +
      Array.from(crypto.randomBytes(4))
        .map((b) => chars[b % chars.length])
        .join("");

    const exists = await User.exists({ referralCode: code });
    if (!exists) return code;
    attempts++;
  }

  return "REF_" + crypto.randomBytes(4).toString("hex").toUpperCase();
};

export async function merchantRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

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
      // Support both the new public mid_... format and legacy MongoDB _id
      // (existing sessions may still carry the old _id until they refresh)
      if (merchantId.startsWith("mid_")) {
        query.merchantId = merchantId;
      } else {
        query._id = merchantId;
      }
    }

    // If multiple merchants exist and no ID provided, this defaults to the first one found.
    // Ideally, dashboard should always send x-merchant-id.
    const merchant = await Merchant.findOne(query);

    if (!merchant) {
      return reply.code(401).send({ error: "Merchant not found" });
    }

    // Lazy Migration: Sync to User
    if (!merchant.userId) {
      let user = await User.findOne({ oauthId });
      if (!user) {
        user = await User.create({
          oauthId,
          creditBalance: parseFloat(
            process.env.WELCOME_CREDIT_AMOUNT || "5.00",
          ),
          welcomeBonusClaimed: true,
        });
      }
      await Merchant.findByIdAndUpdate(merchant._id, {
        $set: { userId: user._id },
      });
      merchant.userId = user._id;
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
      // If oauthHook already sent an error reply, stop here
      if (reply.sent) return;
    }

    // IP Allowlist Check (after successful auth)
    await ipAllowlistMiddleware(request, reply);
  };

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
          logoUrl: z.string().optional(),
          webhookUrl: z.string().optional(),
          oauthId: z.string().optional(), // OAuth identity e.g. 'google:12345'
          referredBy: z.string().optional(), // Referral code from URL
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
        logoUrl,
        webhookUrl,
        oauthId,
        referredBy: referralCode,
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

      // Append timestamp to invoke uniqueness for multi-merchant support
      const uniqueOauthId = oauthId ? `${oauthId}:${Date.now()}` : undefined;

      const welcomeCredit = parseFloat(
        process.env.WELCOME_CREDIT_AMOUNT || "5.00",
      );

      // 1. Resolve or Create User Identity (OAuth)
      let userId: typeof User.prototype._id | undefined = undefined;
      if (oauthId) {
        let user = await User.findOne({ oauthId });
        if (!user) {
          // Resolve Referrer for the new User
          let referrerId: typeof User.prototype._id | undefined = undefined;
          if (referralCode) {
            const referrer = await User.findOne({ referralCode });
            if (referrer) {
              referrerId = referrer._id;
            }
          }

          user = await User.create({
            oauthId,
            email,
            creditBalance: welcomeCredit,
            welcomeBonusClaimed: true,
            referralCode: await generateReferralCode(),
            referredBy: referrerId,
          });
          server.log.info(
            `👤 New User Identity created: ${oauthId} (+$${welcomeCredit} bonus)`,
          );
        }
        userId = user._id;
      }

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
        merchantId: await generateMerchantId(),
        userId,
        name,
        email,
        apiKeyHash,
        oauthId: uniqueOauthId,
        btcXpub,
        btcXpubTestnet: finalBtcXpubTestnet,
        ethAddress,
        ethAddressTestnet: finalEthAddressTestnet,
        logoUrl,
        webhookUrl,
        webhookSecret,
      });

      server.log.info(`Merchant created: ${newMerchant.id}`);

      // Audit log merchant creation
      if (userId) {
        await AuditLogger.account(
          userId.toString(),
          "merchant_created",
          request,
          {
            merchantId: newMerchant.merchantId,
            name,
          },
        );
      }

      return reply.code(201).send({
        id: newMerchant.merchantId,
        merchantId: newMerchant.merchantId,
        name: newMerchant.name,
        email: newMerchant.email,
        logoUrl: newMerchant.logoUrl,
        webhookSecret,
        apiKey: apiKey ?? null, // null for OAuth merchants
      });
    },
  );

  // ──────────────────────────────────────────────
  // GET /v1/merchants — List all merchants for current user
  // ──────────────────────────────────────────────
  server.get(
    "/v1/merchants",
    { preHandler: requireAuth },
    async (request, reply) => {
      const merchant = request.merchant;
      if (!merchant?.oauthId)
        return reply.code(401).send({ error: "Auth required" });
      const { oauthId } = merchant;

      // Clean base oauthId for lookup (e.g. google:123:456 -> google:123)
      const baseOauthId = oauthId.split(":")[0] + ":" + oauthId.split(":")[1];

      const merchants = await Merchant.find({
        oauthId: { $regex: new RegExp(`^${baseOauthId}(:|$)`) },
        isActive: true,
      }).sort({ createdAt: 1 });

      const results = [];
      for (const merchant of merchants) {
        const currentUser = merchant.userId
          ? await User.findById(merchant.userId)
          : null;

        results.push({
          id: merchant.merchantId,
          merchantId: merchant.merchantId,
          name: merchant.name,
          email: merchant.email,
          logoUrl: merchant.logoUrl,
          twoFactorEnabled: currentUser?.twoFactorEnabled || false,
          referralCode: currentUser?.referralCode,
          referralEarningsUsd: currentUser?.referralEarningsUsd || 0,
          creditBalance: currentUser?.creditBalance || 0,
        });
      }

      return results;
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
      // Query using regex to find all merchants matching this base oauthId prefix
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

        // Ensure every merchant has a public merchantId (mid_...)
        if (!merchant.merchantId) {
          const mid = await generateMerchantId();
          const updatedMerchant = await Merchant.findByIdAndUpdate(
            merchant._id,
            { $set: { merchantId: mid } },
            { new: true },
          );
          if (updatedMerchant) merchant = updatedMerchant;
          server.log.info(
            `🆔 Auto-assigned public ID for merchant: ${merchant._id} -> ${mid}`,
          );
        }

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

        // 4. Ensure User Identity (Lazy Migration)
        if (!merchant.userId) {
          const baseOauthId = oauthId.split(":")[0];
          let user = await User.findOne({ oauthId: baseOauthId });
          if (!user) {
            user = await User.create({
              oauthId: baseOauthId,
              creditBalance: parseFloat(
                process.env.WELCOME_CREDIT_AMOUNT || "5.00",
              ),
              welcomeBonusClaimed: true,
              referralCode: await generateReferralCode(),
            });
          }
          const updatedMerchant = await Merchant.findByIdAndUpdate(
            merchant._id,
            { $set: { userId: user._id } },
            { new: true },
          );
          if (updatedMerchant) merchant = updatedMerchant;
        }

        let currentUser = merchant.userId
          ? await User.findById(merchant.userId)
          : null;

        // Ensure legacy user has a referral code
        if (currentUser && !currentUser.referralCode) {
          const code = await generateReferralCode();
          currentUser = await User.findByIdAndUpdate(
            currentUser._id,
            { $set: { referralCode: code } },
            { new: true },
          );
        }

        results.push({
          id: merchant.merchantId,
          merchantId: merchant.merchantId,
          name: merchant.name,
          email: merchant.email,
          logoUrl: merchant.logoUrl,
          apiKey: apiKey ?? null,
          hasApiKey: true,
          twoFactorEnabled: currentUser?.twoFactorEnabled || false,
          referralCode: currentUser?.referralCode,
          referralEarningsUsd: currentUser?.referralEarningsUsd || 0,
          creditBalance: currentUser?.creditBalance || 0,
        });
      }

      return results;
    },
  );

  // ──────────────────────────────────────────────
  // GET /v1/merchants/me — Get Profile
  // ──────────────────────────────────────────────
  server.get(
    "/v1/merchants/me",
    { preHandler: requireAuth },
    async (request, reply) => {
      const merchant = request.merchant;
      if (!merchant) return reply.code(500).send({ error: "Auth failed" });

      const sanitizeXpub = (val?: string) =>
        val && (val.startsWith("mid_") || val.startsWith("knot_")) ? null : val;

      const needsFix =
        !merchant.btcXpubTestnet ||
        !merchant.ethAddressTestnet ||
        merchant.btcXpubTestnet?.startsWith("mid_") ||
        merchant.ethAddressTestnet?.startsWith("mid_");

      let finalBtcXpubTestnet = sanitizeXpub(merchant.btcXpubTestnet);
      let finalEthAddressTestnet = sanitizeXpub(merchant.ethAddressTestnet);

      if (needsFix) {
        const mnemonic = bip39.generateMnemonic();
        const seed = await bip39.mnemonicToSeed(mnemonic);

        const root = bip32.fromSeed(seed, bitcoin.networks.testnet);
        const btcNode = root.derivePath("m/84'/1'/0'");
        finalBtcXpubTestnet =
          finalBtcXpubTestnet || btcNode.neutered().toBase58();

        const ethWallet = ethers.Wallet.fromPhrase(mnemonic);
        finalEthAddressTestnet = finalEthAddressTestnet || ethWallet.address;

        await Merchant.findByIdAndUpdate(merchant._id, {
          $set: {
            btcXpubTestnet: finalBtcXpubTestnet,
            ethAddressTestnet: finalEthAddressTestnet,
          },
        });
      }

      const user = merchant.userId
        ? await User.findById(merchant.userId)
        : null;

      return {
        id: merchant.merchantId,
        merchantId: merchant.merchantId,
        name: merchant.name,
        btcXpub: merchant.btcXpub,
        btcXpubTestnet: finalBtcXpubTestnet,
        ethAddress: merchant.ethAddress,
        ethAddressTestnet: finalEthAddressTestnet,
        webhookUrl: merchant.webhookUrl,
        webhookSecret: merchant.webhookSecret,
        logoUrl: merchant.logoUrl,
        returnUrl: merchant.returnUrl,
        feeResponsibility: merchant.feeResponsibility || "merchant",
        invoiceExpirationMinutes: merchant.invoiceExpirationMinutes || 60,
        underpaymentTolerancePercentage:
          merchant.underpaymentTolerancePercentage ?? 1,
        bip21Enabled: merchant.bip21Enabled ?? true,
        enabledCurrencies: merchant.enabledCurrencies || [],
        webhookEvents: merchant.webhookEvents || [
          "invoice.confirmed",
          "invoice.mempool_detected",
          "invoice.failed",
        ],
        confirmationPolicy: merchant.confirmationPolicy,
        twoFactorEnabled: user?.twoFactorEnabled || false,
        feesAccrued: merchant.feesAccrued,
        creditBalance: user?.creditBalance ?? 0,
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
        message: "Merchant deleted successfully",
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
          email: z.string().email().optional().or(z.literal("")),
          btcXpub: z.string().nullable().optional(),
          btcXpubTestnet: z.string().nullable().optional(),
          ethAddress: z.string().nullable().optional(),
          ethAddressTestnet: z.string().nullable().optional(),
          webhookUrl: z.string().nullable().optional().or(z.literal("")),
          webhookEvents: z.array(z.string()).optional(),
          logoUrl: z.string().nullable().optional().or(z.literal("")),
          returnUrl: z.string().nullable().optional().or(z.literal("")),
          feeResponsibility: z.enum(["merchant", "client"]).optional(),
          invoiceExpirationMinutes: z.number().min(15).max(43200).optional(),
          underpaymentTolerancePercentage: z.number().min(0).max(10).optional(),
          bip21Enabled: z.boolean().optional(),
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

      // Audit log profile update
      await AuditLogger.settings(
        merchant.userId?.toString() || merchant._id.toString(),
        "profile_updated",
        request,
        { fields: Object.keys(updates) },
      );

      return {
        id: updated.merchantId,
        merchantId: updated.merchantId,
        name: updated.name,
        btcXpub: updated.btcXpub,
        btcXpubTestnet: updated.btcXpubTestnet,
        ethAddress: updated.ethAddress,
        ethAddressTestnet: updated.ethAddressTestnet,
        webhookUrl: updated.webhookUrl,
        webhookSecret: updated.webhookSecret,
        feeResponsibility: updated.feeResponsibility,
        invoiceExpirationMinutes: updated.invoiceExpirationMinutes,
        underpaymentTolerancePercentage:
          updated.underpaymentTolerancePercentage,
        bip21Enabled: updated.bip21Enabled,
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

      // Audit log key rotation
      await AuditLogger.security(
        merchant.userId?.toString() || merchant._id.toString(),
        "api_key_generated", // We use generated as the action for rotation too
        request,
      );

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
  // POST /v1/merchants/me/plan — Update Plan (Upgrade/Downgrade)
  // ──────────────────────────────────────────────
  server.post(
    "/v1/merchants/me/plan",
    {
      preHandler: requireAuth,
      schema: {
        body: z.object({
          plan: z.enum(["starter", "professional", "enterprise"]),
        }),
      },
    },
    async (request, reply) => {
      const merchant = request.merchant;
      if (!merchant) return reply.code(401).send({ error: "Unauthorized" });

      const { plan: newPlan } = request.body;
      const currentPlan = merchant.plan || "starter";

      if (newPlan === currentPlan) {
        return reply.code(400).send({ error: "Already on this plan." });
      }

      // Plan costs
      const PLAN_COSTS = {
        starter: 0,
        professional: 29,
        enterprise: 99,
      };

      const cost = PLAN_COSTS[newPlan];
      const currentPlanCost =
        PLAN_COSTS[currentPlan as keyof typeof PLAN_COSTS] || 0;

      // Calculate prorated amount for mid-month activation
      let chargeAmount = cost;
      let isProrated = false;

      if (cost > 0 && cost > currentPlanCost) {
        const today = new Date();
        const lastDayOfMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0,
        );
        const daysRemainingInMonth =
          lastDayOfMonth.getDate() - today.getDate() + 1;
        const totalDaysInMonth = lastDayOfMonth.getDate();

        // Prorate if activating after the 1st of the month
        if (today.getDate() > 1 && daysRemainingInMonth < totalDaysInMonth) {
          chargeAmount = (cost * daysRemainingInMonth) / totalDaysInMonth;
          isProrated = true;

          console.log(
            `📅 Prorated ${newPlan} plan: $${chargeAmount.toFixed(2)} for ${daysRemainingInMonth} days`,
          );
        }
      }

      // If upgrading to a paid plan, check balance
      if (chargeAmount > 0) {
        const user = merchant.userId
          ? await User.findById(merchant.userId)
          : null;
        if (!user || user.creditBalance < chargeAmount) {
          return reply.code(400).send({
            error: `Insufficient balance to upgrade to ${newPlan}. You need at least $${chargeAmount.toFixed(2)} in credits${isProrated ? " (prorated for this month)" : ""}.`,
            required: chargeAmount,
            currentBalance: user?.creditBalance || 0,
            isProrated,
          });
        }

        // Deduct prorated amount immediately
        await User.findByIdAndUpdate(user._id, {
          $inc: { creditBalance: -chargeAmount },
        });

        await Merchant.findByIdAndUpdate(merchant._id, {
          $set: {
            plan: newPlan,
            planStartedAt: new Date(),
            lastProratedAmount: isProrated ? chargeAmount : null,
            lastProratedDate: isProrated ? new Date() : null,
          },
        });

        // Notify
        const message = isProrated
          ? `Upgraded to ${newPlan} plan for $${chargeAmount.toFixed(2)} (prorated for this month). Full billing starts next month on the 1st.`
          : `Upgraded to ${newPlan} plan for $${chargeAmount.toFixed(2)}.`;

        NotificationService.create({
          merchantId: merchant._id.toString(),
          title: `Upgraded to ${newPlan.toUpperCase()}`,
          description: message,
          type: "success",
          link: "/dashboard/billing",
        });
      } else {
        // Downgrading or switching between paid plans (simple update for now)
        await Merchant.findByIdAndUpdate(merchant._id, {
          $set: {
            plan: newPlan,
            planStartedAt: new Date(),
          },
        });
      }

      return {
        success: true,
        plan: newPlan,
        message: `Plan updated to ${newPlan} successfully.`,
      };
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
      let groupBy: Record<string, unknown>;
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

      const user = merchant.userId
        ? await User.findById(merchant.userId)
        : null;

      // Extra analytics: invoice count by currency breakdown
      const currencyBreakdown = await Invoice.aggregate<{
        _id: string;
        count: number;
        volume: number;
      }>([
        {
          $match: {
            merchantId: merchant._id,
            status: "confirmed",
            "metadata.isTestnet": { $ne: true },
          },
        },
        {
          $group: {
            _id: "$cryptoCurrency",
            count: { $sum: 1 },
            volume: { $sum: "$amountUsd" },
          },
        },
        { $sort: { volume: -1 } },
        { $limit: 5 },
      ]);

      const pendingCount = await Invoice.countDocuments({
        merchantId: merchant._id,
        status: "pending",
        "metadata.isTestnet": { $ne: true },
      });

      return {
        totalVolume,
        testnetVolume,
        testnetInvoicesCount,
        activeInvoices: totalInvoices,
        pendingInvoices: pendingCount,
        confirmedInvoices: confirmedInvoicesCount,
        conversionRate: successRate + "%",
        successRate: `${successRate}%`,
        chartData,
        topCurrencies: currencyBreakdown.map((c) => ({
          currency: c._id,
          count: c.count,
          volume: parseFloat(c.volume.toFixed(2)),
        })),
        feesAccrued: merchant.feesAccrued || { usd: 0 },
        creditBalance: user?.creditBalance ?? 0,
        currentPlan: merchant.plan || "starter",
        currentFeeRate:
          (
            {
              starter: 0.015,
              professional: 0.0075,
              enterprise: 0.005,
            } as Record<string, number>
          )[merchant.plan || "starter"] || 0.015,
        platformFeeWallets: {
          BTC: null,
          LTC: null,
          EVM: process.env.PLATFORM_FEE_WALLET_EVM || null,
        },
        isGracePeriod: merchant.gracePeriodStarted ? true : false,
        gracePeriodEnds: merchant.gracePeriodEnds
          ? merchant.gracePeriodEnds.toISOString()
          : undefined,
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
        // Billing is strictly Stablecoins (USDT/USDC) on EVM
        const STABLECOINS = [
          "USDT_ERC20",
          "USDT_POLYGON",
          "USDC_ERC20",
          "USDC_POLYGON",
        ];
        if (!STABLECOINS.includes(currency)) {
          return reply.code(400).send({
            error:
              "Top-ups are strictly limited to Stablecoins (USDT/USDC) on Polygon or Ethereum.",
          });
        }

        const expectedAddress = process.env.PLATFORM_FEE_WALLET_EVM || "";

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

        if (merchant.userId) {
          await User.findByIdAndUpdate(merchant.userId, {
            $inc: { creditBalance: usdAmount },
          });
        }

        // Check if merchant is in grace period and has sufficient balance now
        if (
          merchant.gracePeriodStarted &&
          merchant.gracePeriodEnds &&
          new Date() < merchant.gracePeriodEnds
        ) {
          const planCosts = {
            professional: 29,
            enterprise: 99,
          };

          const planCost =
            planCosts[merchant.plan as keyof typeof planCosts] || 0;
          const user = merchant.userId
            ? await User.findById(merchant.userId)
            : null;

          if (user && user.creditBalance >= planCost) {
            console.log(
              `💳 Auto-charging ${merchant.plan} plan during grace period for ${merchant.merchantId}`,
            );

            // Charge for the subscription
            await User.findByIdAndUpdate(user._id, {
              $inc: { creditBalance: -planCost },
            });

            // Clear grace period and reset plan start date
            await Merchant.findByIdAndUpdate(merchant._id, {
              $set: {
                gracePeriodStarted: null,
                gracePeriodEnds: null,
                planStartedAt: new Date(),
              },
            });

            // Send success notification
            await NotificationService.create({
              merchantId: merchant._id.toString(),
              title: "Payment Successful - Plan Maintained",
              description: `Your ${merchant.plan} plan payment has been processed. Grace period cleared.`,
              type: "success",
              link: "/dashboard/billing",
            });
          }
        }

        const user = merchant.userId
          ? await User.findById(merchant.userId)
          : null;

        // 6. Referral Bonus Payout (10% to the referrer)
        if (user && user.referredBy) {
          const referralBonus = parseFloat((usdAmount * 0.1).toFixed(2));
          if (referralBonus > 0) {
            const referrer = await User.findById(user.referredBy);
            if (referrer) {
              await User.findByIdAndUpdate(referrer._id, {
                $inc: {
                  creditBalance: referralBonus,
                  referralEarningsUsd: referralBonus,
                },
              });

              // Notify the referrer on one of their merchants
              const referrerMerchant = await Merchant.findOne({
                userId: referrer._id,
              });
              if (referrerMerchant) {
                await NotificationService.create({
                  merchantId: referrerMerchant._id.toString(),
                  title: "Referral Bonus Received! 🎁",
                  description: `You earned $${referralBonus.toFixed(2)} from a user top-up.`,
                  type: "success",
                  link: "/dashboard/referrals",
                });
              }

              server.log.info(
                `🎁 Referral Bonus: User(${user.referredBy}) +$${referralBonus} (From User(${user._id}))`,
              );
            }
          }
        }

        // Fetch fresh state for response
        const updatedUser = merchant.userId
          ? await User.findById(merchant.userId)
          : null;

        server.log.info(
          `🤑 Top-Up Claimed: ${merchant._id} +$${usdAmount} (${txHash})`,
        );

        return reply.send({
          success: true,
          addedUsd: usdAmount,
          newCreditBalance: updatedUser?.creditBalance,
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
  // POST /v1/merchants/promo/generate — Internal: Generate Promo Code
  // ──────────────────────────────────────────────
  server.post(
    "/v1/merchants/promo/generate",
    {
      schema: {
        body: z.object({
          amountUsd: z.number().positive(),
          maxUses: z.number().int().min(1).optional(),
          expiresInDays: z.number().int().min(1).optional(),
          customCode: z.string().min(4).optional(),
        }),
      },
    },
    async (request, reply) => {
      // Protect with internal secret
      const secret = request.headers["x-internal-secret"];
      if (secret !== process.env.INTERNAL_SECRET) {
        return reply.code(403).send({ error: "Forbidden" });
      }

      const { amountUsd, maxUses, expiresInDays, customCode } = request.body;

      const code =
        customCode ||
        "PROMO_" + crypto.randomBytes(4).toString("hex").toUpperCase();

      const existingCode = await PromoCode.findOne({ code });
      if (existingCode) {
        return reply.code(400).send({ error: "Code already exists" });
      }

      let expiresAt: Date | undefined;
      if (expiresInDays) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);
      }

      const promo = await PromoCode.create({
        code,
        amountUsd,
        maxUses: maxUses || 1,
        expiresAt,
      });

      server.log.info(`🎁 Promo Code generated: ${code} ($${amountUsd})`);

      return reply.code(201).send({
        success: true,
        code: promo.code,
        amountUsd: promo.amountUsd,
        expiresAt: promo.expiresAt,
      });
    },
  );

  // ──────────────────────────────────────────────
  // POST /v1/merchants/me/promo/redeem — Redeem Promo Code
  // ──────────────────────────────────────────────
  server.post(
    "/v1/merchants/me/promo/redeem",
    {
      preHandler: requireAuth,
      schema: {
        body: z.object({
          code: z.string().min(1),
        }),
      },
    },
    async (request, reply) => {
      const merchant = request.merchant;
      if (!merchant) return reply.code(401).send({ error: "Unauthorized" });

      const { code } = request.body;
      const promo = await PromoCode.findOne({
        code: code.trim().toUpperCase(),
        isActive: true,
      });

      if (!promo) {
        return reply
          .code(400)
          .send({ error: "Invalid or expired promo code." });
      }

      // Check global limit
      if (promo.uses >= promo.maxUses) {
        return reply
          .code(400)
          .send({ error: "This promo code has reached its usage limit." });
      }

      // Check if user already claimed it
      if (merchant.userId && promo.claimedBy.includes(merchant.userId)) {
        return reply
          .code(400)
          .send({ error: "You have already redeemed this promo code." });
      }

      // Check expiration
      if (promo.expiresAt && promo.expiresAt < new Date()) {
        return reply.code(400).send({ error: "This promo code has expired." });
      }

      // Everything looks good, update balance and mark as used
      if (merchant.userId) {
        await User.findByIdAndUpdate(merchant.userId, {
          $inc: { creditBalance: promo.amountUsd },
        });

        await PromoCode.findByIdAndUpdate(promo._id, {
          $inc: { uses: 1 },
          $push: { claimedBy: merchant.userId },
        });

        // Notify
        NotificationService.create({
          merchantId: merchant._id.toString(),
          title: "Credits Redeemed! 🎟️",
          description: `Success! $${promo.amountUsd.toFixed(2)} has been added to your balance via promo code.`,
          type: "success",
          link: "/dashboard/billing",
        });

        server.log.info(
          `🎟️ Promo Redeemed: ${merchant.merchantId} used ${promo.code} (+$${promo.amountUsd})`,
        );

        const updatedUser = await User.findById(merchant.userId);

        return reply.send({
          success: true,
          addedUsd: promo.amountUsd,
          newCreditBalance: updatedUser?.creditBalance,
        });
      }

      return reply
        .code(400)
        .send({ error: "Failed to resolve user identity." });
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
  // POST /v1/merchants/me/charge-plan — Charge for plan during grace period
  // ──────────────────────────────────────────────
  server.post(
    "/v1/merchants/me/charge-plan",
    { preHandler: requireAuth },
    async (request, reply) => {
      const merchant = request.merchant;
      if (!merchant) return reply.code(401).send({ error: "Unauthorized" });

      // Check if merchant is in grace period
      if (!merchant.gracePeriodStarted || !merchant.gracePeriodEnds) {
        return reply.code(400).send({ error: "Not in grace period" });
      }

      if (new Date() >= merchant.gracePeriodEnds) {
        return reply.code(400).send({ error: "Grace period expired" });
      }

      const planCosts = {
        professional: 29,
        enterprise: 99,
      };

      const planCost = planCosts[merchant.plan as keyof typeof planCosts] || 0;
      if (planCost === 0) {
        return reply.code(400).send({ error: "Starter plan has no cost" });
      }

      const user = merchant.userId
        ? await User.findById(merchant.userId)
        : null;

      if (!user) {
        return reply.code(400).send({ error: "User not found" });
      }

      if (user.creditBalance < planCost) {
        return reply.code(400).send({
          error: "Insufficient balance",
          required: planCost,
          currentBalance: user.creditBalance,
        });
      }

      try {
        // Charge for the subscription
        await User.findByIdAndUpdate(user._id, {
          $inc: { creditBalance: -planCost },
        });

        // Clear grace period and reset plan start date
        await Merchant.findByIdAndUpdate(merchant._id, {
          $set: {
            gracePeriodStarted: null,
            gracePeriodEnds: null,
            planStartedAt: new Date(),
          },
        });

        // Send success notification
        await NotificationService.create({
          merchantId: merchant._id.toString(),
          title: "Payment Successful - Plan Maintained",
          description: `Your ${merchant.plan} plan payment has been processed. Grace period cleared.`,
          type: "success",
          link: "/dashboard/billing",
        });

        return reply.send({
          success: true,
          charged: planCost,
          newBalance: user.creditBalance - planCost,
        });
      } catch (error) {
        console.error("Failed to charge plan:", error);
        return reply.code(500).send({ error: "Failed to process payment" });
      }
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

  // ──────────────────────────────────────────────
  // GET /v1/merchants/me/ip-allowlist — Get IP Allowlist
  // ──────────────────────────────────────────────
  server.get(
    "/v1/merchants/me/ip-allowlist",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      const merchant = request.merchant;
      if (!merchant) return reply.code(401).send({ error: "Unauthorized" });

      return {
        enabled: merchant.ipAllowlistEnabled,
        allowedIps: merchant.allowedIpAddresses || [],
      };
    },
  );

  // ──────────────────────────────────────────────
  // POST /v1/merchants/me/ip-allowlist — Update IP Allowlist
  // ──────────────────────────────────────────────
  server.post(
    "/v1/merchants/me/ip-allowlist",
    {
      preHandler: requireAuth,
      schema: {
        body: z.object({
          enabled: z.boolean(),
          allowedIps: z.array(z.string()).optional(),
        }),
      },
    },
    async (request, reply) => {
      const merchant = request.merchant;
      if (!merchant) return reply.code(401).send({ error: "Unauthorized" });

      const { enabled, allowedIps } = request.body;

      await Merchant.findByIdAndUpdate(merchant._id, {
        $set: {
          ipAllowlistEnabled: enabled,
          allowedIpAddresses: allowedIps || [],
        },
      });

      // Audit log
      await AuditLogger.security(
        merchant.userId?.toString() || merchant._id.toString(),
        "ip_allowlist_updated",
        request,
        { enabled, allowedIps },
      );

      return {
        success: true,
        enabled,
        allowedIps: allowedIps || [],
      };
    },
  );

  // ──────────────────────────────────────────────
  // POST /v1/merchants/me/ip-allowlist/validate — Validate IP
  // ──────────────────────────────────────────────
  server.post(
    "/v1/merchants/me/ip-allowlist/validate",
    {
      preHandler: requireAuth,
      schema: {
        body: z.object({
          ip: z.string().ip(),
        }),
      },
    },
    async (request, reply) => {
      const merchant = request.merchant;
      if (!merchant) return reply.code(401).send({ error: "Unauthorized" });

      const { ip } = request.body;

      if (
        !merchant.ipAllowlistEnabled ||
        !merchant.allowedIpAddresses?.length
      ) {
        return { valid: true, message: "IP allowlisting not enabled" };
      }

      const isValid = merchant.allowedIpAddresses.some((allowedIp) => {
        if (allowedIp === ip) return true;
        if (allowedIp.includes("/")) {
          return ipInCidr(ip, allowedIp);
        }
        if (allowedIp.includes("*")) {
          const pattern = allowedIp.replace(/\*/g, ".*");
          const regex = new RegExp(`^${pattern}$`);
          return regex.test(ip);
        }
        return false;
      });

      return {
        valid: isValid,
        message: isValid ? "IP is allowed" : "IP is not in allowlist",
      };
    },
  );
}

// ──────────────────────────────────────────────
// Helper: Check if IP is in CIDR range
// ──────────────────────────────────────────────
function ipInCidr(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split("/");
  const bitCount = parseInt(bits, 10);
  const mask = bitCount === 0 ? 0 : (0xffffffff << (32 - bitCount)) >>> 0;

  const ipNum = ipToNumber(ip);
  const rangeNum = ipToNumber(range);

  return (ipNum & mask) === (rangeNum & mask);
}

function ipToNumber(ip: string): number {
  return (
    ip
      .split(".")
      .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0
  );
}
