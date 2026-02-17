import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { Merchant } from "@tyepay/database";
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
}
