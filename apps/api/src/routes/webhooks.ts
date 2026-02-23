import { FastifyInstance } from "fastify";
import * as crypto from "crypto";
import { ConfirmationEngine } from "../core/confirmation-engine.js";

/**
 * 📡 Webhook Listener Routes
 *
 * Receives blockchain event notifications from providers like
 * Alchemy and Tatum, then routes them through the ConfirmationEngine.
 */
export async function webhookRoutes(app: FastifyInstance) {
  /**
   * Alchemy Webhook Endpoint
   * Receives ADDRESS_ACTIVITY events for monitored payment addresses.
   *
   * Alchemy sends a POST with a JSON body containing:
   * - webhookId, id, createdAt, type
   * - event.network, event.activity[] (array of address activities)
   *
   * Signature verification via X-Alchemy-Signature header.
   */
  // Add a GET health check for manual browser testing
  app.get("/v1/webhooks/alchemy", async () => {
    return { status: "ok", message: "Alchemy Webhook Listener is live!" };
  });

  app.post("/v1/webhooks/alchemy", async (request, reply) => {
    app.log.info("📡 Incoming Alchemy webhook request...");
    const signingKey = process.env.ALCHEMY_WEBHOOK_SIGNING_KEY;

    // 1. Verify signature if signing key is configured
    if (signingKey) {
      const signature = request.headers["x-alchemy-signature"] as string;
      const rawBody = JSON.stringify(request.body);

      const expectedSig = crypto
        .createHmac("sha256", signingKey)
        .update(rawBody)
        .digest("hex");

      if (signature !== expectedSig) {
        // Alchemy's "Test" button sends a request with no signature.
        // We allow it to return 200 so the button turns green, but we log a warning.
        if (!signature) {
          app.log.info("🧪 Alchemy test ping (no signature) received.");
          return reply.code(200).send({ message: "Test ping received" });
        }

        app.log.warn(`⚠️ Alchemy signature mismatch. Header: ${signature}`);
        return reply.code(401).send({ error: "Invalid signature" });
      }
    }

    const body = request.body as AlchemyWebhookBody;

    // Handle Alchemy "Test Webhook" ping which might be empty or different
    if (
      !body ||
      (!body.event && (body as unknown as Record<string, unknown>).webhookId)
    ) {
      app.log.info("🧪 Alchemy test ping received.");
      return reply.code(200).send({ message: "Test received" });
    }

    if (!body?.event?.activity) {
      return reply.code(400).send({ error: "Invalid webhook payload" });
    }

    const results = [];

    // 2. Process each activity in the event
    for (const activity of body.event.activity) {
      // We only care about incoming transfers (to our payment addresses)
      if (activity.category === "external" || activity.category === "erc20") {
        try {
          const result = await ConfirmationEngine.processBlockchainEvent({
            toAddress: activity.toAddress?.toLowerCase() || "",
            txHash: activity.hash,
            blockNumber: parseInt(activity.blockNum, 16) || -1,
            confirmations: 0, // Alchemy ADDRESS_ACTIVITY fires at 0-conf
            amount: activity.value?.toString() || "0",
            asset: activity.asset || activity.rawContract?.address || "ETH",
            source: "alchemy",
            rawPayload: activity as unknown as Record<string, unknown>,
          });

          results.push(result);

          if (result.matched) {
            app.log.info(
              `✅ Alchemy event matched invoice ${result.invoiceId} → ${result.newStatus}`,
            );
          }
        } catch (err) {
          app.log.error(`❌ Error processing Alchemy activity: ${err}`);
        }
      }
    }

    return reply.code(200).send({
      processed: results.length,
      matched: results.filter((r) => r.matched).length,
    });
  });

  /**
   * Tatum Webhook Endpoint
   * Receives transaction notifications for monitored addresses.
   *
   * Tatum sends:
   * - address, txId, blockNumber, amount, asset, type
   */
  app.post("/v1/webhooks/tatum", async (request, reply) => {
    const signingKey = process.env.TATUM_WEBHOOK_SECRET;

    // 1. Verify signature if signing key is configured
    if (signingKey) {
      const signature = request.headers["x-payload-hash"] as string;
      const rawBody = JSON.stringify(request.body);

      const expectedSig = crypto
        .createHmac("sha512", signingKey)
        .update(rawBody)
        .digest("base64");

      if (signature && signature !== expectedSig) {
        const expectedSigHex = crypto
          .createHmac("sha512", signingKey)
          .update(rawBody)
          .digest("hex");

        if (signature !== expectedSigHex) {
          app.log.warn("⚠️ Tatum webhook signature mismatch");
          return reply.code(401).send({ error: "Invalid signature" });
        }
      }
    }

    const body = request.body as TatumWebhookBody;

    if (!body?.address || !body?.txId) {
      return reply.code(400).send({ error: "Invalid Tatum webhook payload" });
    }

    try {
      const result = await ConfirmationEngine.processBlockchainEvent({
        toAddress: body.address.toLowerCase(),
        txHash: body.txId,
        blockNumber: body.blockNumber || -1,
        confirmations: body.confirmations || 0,
        amount: body.amount?.toString() || "0",
        asset: body.asset || body.currency || "BTC",
        source: "tatum",
        rawPayload: body as unknown as Record<string, unknown>,
      });

      if (result.matched) {
        app.log.info(
          `✅ Tatum event matched invoice ${result.invoiceId} → ${result.newStatus}`,
        );
      }

      return reply.code(200).send(result);
    } catch (err) {
      app.log.error(`❌ Error processing Tatum webhook: ${err}`);
      return reply.code(500).send({ error: "Internal processing error" });
    }
  });

  /**
   * Manual Confirmation Endpoint (Development Only)
   * Allows simulating a blockchain event for testing.
   */
  app.post("/v1/webhooks/simulate", async (request, reply) => {
    if (
      process.env.NODE_ENV === "production" &&
      !process.env.ALLOW_SIMULATION
    ) {
      return reply.code(403).send({ error: "Not available in production" });
    }

    const body = request.body as SimulateWebhookBody & { invoiceId?: string };
    let targetAddress = body.toAddress;

    // 1. If invoiceId is provided, look up the payAddress
    if (body.invoiceId && !targetAddress) {
      const { Invoice } = await import("@qodinger/knot-database");
      const invoice = await Invoice.findOne({ invoiceId: body.invoiceId });
      if (!invoice) {
        return reply.code(404).send({ error: "Invoice not found" });
      }
      targetAddress = invoice.payAddress;
    }

    if (!targetAddress || !body.txHash) {
      return reply
        .code(400)
        .send({ error: "toAddress (or invoiceId) and txHash are required" });
    }

    const result = await ConfirmationEngine.processBlockchainEvent({
      toAddress: targetAddress.toLowerCase(),
      txHash: body.txHash,
      blockNumber: body.blockNumber || -1,
      confirmations: body.confirmations || 0,
      amount: body.amount || "0",
      asset: body.asset || "BTC",
      source: "manual",
      invoiceId: body.invoiceId,
      rawPayload: body as unknown as Record<string, unknown>,
    });

    return reply.code(200).send(result);
  });
}

// ============================================================
// Provider-specific types
// ============================================================

interface AlchemyActivity {
  category: string;
  fromAddress: string;
  toAddress: string;
  hash: string;
  blockNum: string;
  value: number;
  asset: string;
  rawContract?: {
    address: string;
    decimals: number;
  };
}

interface AlchemyWebhookBody {
  webhookId: string;
  id: string;
  createdAt: string;
  type: string;
  event: {
    network: string;
    activity: AlchemyActivity[];
  };
}

interface TatumWebhookBody {
  address: string;
  txId: string;
  blockNumber?: number;
  confirmations?: number;
  amount?: number;
  asset?: string;
  currency?: string;
  type?: string;
}

interface SimulateWebhookBody {
  toAddress: string;
  txHash: string;
  blockNumber?: number;
  confirmations?: number;
  amount?: string;
  asset?: string;
}
