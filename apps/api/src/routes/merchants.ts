/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { Merchant, Invoice } from "@tyepay/database";
import * as crypto from "crypto";
import { TatumProvider } from "../infra/tatum-provider";

export async function merchantRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post(
    "/v1/merchants",
    {
      schema: {
        body: z.object({
          name: z.string().min(1),
          btcXpub: z.string().optional(),
          ethAddress: z.string().optional(),
          webhookUrl: z.string().url().optional(),
        }),
        response: {
          201: z.object({
            id: z.string(),
            name: z.string(),
            apiKey: z.string(), // Returned only once!
          }),
        },
      },
    },
    async (request, reply) => {
      const { name, btcXpub, ethAddress, webhookUrl } = request.body;

      // 1. Generate a secure API Key
      const apiKey = `tye_${crypto.randomBytes(24).toString("hex")}`;
      const apiKeyHash = crypto
        .createHash("sha256")
        .update(apiKey)
        .digest("hex");

      // 2. Insert into DB
      const newMerchant = await Merchant.create({
        name,
        apiKeyHash,
        btcXpub,
        ethAddress,
        webhookUrl,
      });

      server.log.info(`Merchant created: ${newMerchant.id}`);

      // 3. SaaS Automation: Register xPub with Tatum if present
      if (btcXpub && process.env.PUBLIC_URL) {
        const tatumWebhookUrl = `${process.env.PUBLIC_URL}/v1/webhooks/tatum`;
        await TatumProvider.subscribeMerchantXpub(btcXpub, tatumWebhookUrl);
      }

      return reply.code(201).send({
        id: newMerchant.id,
        name: newMerchant.name,
        apiKey, // Show raw key one time
      });
    },
  );
  // ──────────────────────────────────────────────
  // Middleware: API Key Authentication for me/ routes
  // ──────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const authHook = async (request: any, reply: any) => {
    const apiKey = request.headers["x-api-key"] as string;
    if (!apiKey) return reply.code(401).send({ error: "Missing API Key" });

    const apiKeyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
    const merchant = await Merchant.findOne({ apiKeyHash, isActive: true });

    if (!merchant) return reply.code(401).send({ error: "Invalid API Key" });
    request.merchant = merchant;
  };

  // ──────────────────────────────────────────────
  // GET /v1/merchants/me — Get Profile
  // ──────────────────────────────────────────────
  server.get("/v1/merchants/me", { preHandler: authHook }, async (request) => {
    const merchant = (request as any).merchant;
    return {
      id: merchant._id,
      name: merchant.name,
      btcXpub: merchant.btcXpub,
      ethAddress: merchant.ethAddress,
      webhookUrl: merchant.webhookUrl,
      confirmationPolicy: merchant.confirmationPolicy,
      createdAt: merchant.createdAt,
    };
  });

  // ──────────────────────────────────────────────
  // PATCH /v1/merchants/me — Update Profile
  // ──────────────────────────────────────────────
  server.patch(
    "/v1/merchants/me",
    {
      preHandler: authHook,
      schema: {
        body: z.object({
          name: z.string().min(1).optional(),
          btcXpub: z.string().optional(),
          ethAddress: z.string().optional(),
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

      const updated = await Merchant.findByIdAndUpdate(
        merchant._id,
        { $set: updates },
        { new: true },
      );

      return {
        id: updated!._id,
        name: updated!.name,
        btcXpub: updated!.btcXpub,
        ethAddress: updated!.ethAddress,
        webhookUrl: updated!.webhookUrl,
        confirmationPolicy: updated!.confirmationPolicy,
      };
    },
  );

  // ──────────────────────────────────────────────
  // POST /v1/merchants/me/keys — Rotate Key
  // ──────────────────────────────────────────────
  server.post(
    "/v1/merchants/me/keys",
    { preHandler: authHook },
    async (request, reply) => {
      const merchant = (request as any).merchant;

      // Generate new key
      const newApiKey = `tye_${crypto.randomBytes(24).toString("hex")}`;
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
  // GET /v1/merchants/me/stats — Dashboard Stats
  // ──────────────────────────────────────────────
  server.get(
    "/v1/merchants/me/stats",
    { preHandler: authHook },
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
      };
    },
  );
}
