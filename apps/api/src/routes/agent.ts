import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { Invoice, Merchant } from "@tyepay/database";
import { Derivator } from "@tyepay/crypto";
import { PriceOracle } from "../infra/price-feed";
import { ConfirmationEngine } from "../core/confirmation-engine";
import { Currency } from "@tyepay/types";
import * as crypto from "crypto";

/**
 * 🤖 x402 Agentic Payment Bridge
 *
 * Implements the HTTP 402 Payment Required protocol for AI agents.
 * This allows autonomous agents to:
 *   1. Discover payment requirements (GET → 402 response)
 *   2. Create invoices programmatically
 *   3. Submit payment proofs via headers
 *   4. Access resources after payment verification
 *
 * Flow:
 *   Agent → GET /v1/agent/resource  → 402 + Payment details
 *   Agent → POST /v1/agent/pay      → Creates invoice
 *   Agent → POST /v1/agent/settle   → Submits tx_hash proof
 *   Agent → GET /v1/agent/resource  → 200 + Resource (after confirmation)
 */
export async function agentRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // ──────────────────────────────────────────────
  // GET /v1/agent/resource — Protected Resource (x402 Demo)
  // ──────────────────────────────────────────────
  server.get("/v1/agent/resource", async (request, reply) => {
    // Check for x402 payment proof header
    const paymentProof = request.headers["x-payment-proof"] as string;

    if (!paymentProof) {
      // Return 402 with payment instructions
      return reply
        .code(402)
        .header("WWW-Authenticate", 'X-Payment realm="TyePay", protocol="x402"')
        .header("X-Payment-Address", "bc1q_demo_address")
        .header("X-Payment-Amount", "0.0001")
        .header("X-Payment-Currency", "BTC")
        .send({
          error: "Payment Required",
          message:
            "This resource requires a micropayment via x402 protocol. Submit a payment and include the invoice_id in X-Payment-Proof header.",
          protocol: "x402",
          how_to_pay: {
            step_1: "POST /v1/agent/pay with amount and currency",
            step_2: "Send crypto to the returned pay_address",
            step_3:
              "POST /v1/agent/settle with invoice_id and tx_hash to prove payment",
            step_4:
              "GET /v1/agent/resource with X-Payment-Proof: <invoice_id> to access resource",
          },
        });
    }

    // Verify the payment proof (invoice_id)
    const invoice = await Invoice.findOne({
      invoiceId: paymentProof,
      isAgenticPayment: true,
      status: "confirmed",
    });

    if (!invoice) {
      return reply.code(402).send({
        error: "Payment Required",
        message:
          "Invalid or unconfirmed payment proof. Ensure your invoice is confirmed.",
      });
    }

    // Payment verified — grant access
    return {
      status: "access_granted",
      message: "Payment verified via x402 protocol. Here is your resource.",
      invoice_id: invoice.invoiceId,
      data: {
        // Example protected resource data
        resource_type: "api_access",
        granted_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    };
  });

  // ──────────────────────────────────────────────
  // POST /v1/agent/pay — Create Agentic Invoice
  // ──────────────────────────────────────────────
  server.post(
    "/v1/agent/pay",
    {
      schema: {
        body: z.object({
          amount_usd: z.number().positive(),
          currency: z.enum(["BTC", "LTC", "USDT_ERC20", "USDT_POLYGON"]),
          /** Merchant API key (the service the agent is paying) */
          merchant_api_key: z.string(),
          /** Agent-provided metadata */
          agent_metadata: z
            .object({
              agent_id: z.string().optional(),
              purpose: z.string().optional(),
              session_id: z.string().optional(),
            })
            .optional(),
        }),
      },
    },
    async (request, reply) => {
      const { amount_usd, currency, merchant_api_key, agent_metadata } =
        request.body;

      // 1. Authenticate merchant
      const apiKeyHash = crypto
        .createHash("sha256")
        .update(merchant_api_key)
        .digest("hex");

      const merchant = await Merchant.findOne({ apiKeyHash, isActive: true });

      if (!merchant) {
        return reply.code(401).send({ error: "Invalid merchant API key" });
      }

      // 2. Get crypto price
      const priceUsd = await PriceOracle.getPrice(currency as Currency);
      const cryptoAmount = parseFloat((amount_usd / priceUsd).toFixed(8));

      // 3. Derive payment address
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
        );
      } else {
        if (!merchant.ethAddress) {
          return reply
            .code(400)
            .send({ error: "Merchant has no ETH address configured" });
        }
        payAddress = merchant.ethAddress;
      }

      // 4. Get required confirmations
      const requiredConfirmations =
        await ConfirmationEngine.getRequiredConfirmations(
          merchant._id.toString(),
          currency,
        );

      // 5. Create the agentic invoice
      const invoiceId = `inv_${crypto.randomBytes(12).toString("hex")}`;
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min TTL for agents

      await Invoice.create({
        merchantId: merchant._id,
        invoiceId,
        amountUsd: amount_usd,
        cryptoAmount,
        cryptoCurrency: currency,
        payAddress,
        derivationIndex: nextIndex,
        requiredConfirmations,
        expiresAt,
        isAgenticPayment: true,
        metadata: agent_metadata || {},
      });

      await Merchant.findByIdAndUpdate(merchant._id, {
        derivationIndex: nextIndex,
      });

      server.log.info(`🤖 Agentic invoice created: ${invoiceId}`);

      // Return 402 with structured payment details
      return reply
        .code(402)
        .header(
          "WWW-Authenticate",
          `X-Payment realm="TyePay", invoice="${invoiceId}"`,
        )
        .header("X-Payment-Address", payAddress)
        .header("X-Payment-Amount", cryptoAmount.toString())
        .header("X-Payment-Currency", currency)
        .header("X-Invoice-Id", invoiceId)
        .send({
          status: "payment_required",
          invoice_id: invoiceId,
          payment_details: {
            amount_usd: amount_usd,
            crypto_amount: cryptoAmount,
            currency: currency,
            pay_address: payAddress,
            required_confirmations: requiredConfirmations,
            expires_at: expiresAt.toISOString(),
          },
          next_step:
            "Send the exact crypto amount to pay_address, then POST /v1/agent/settle with invoice_id and tx_hash.",
        });
    },
  );

  // ──────────────────────────────────────────────
  // POST /v1/agent/settle — Submit Payment Proof
  // ──────────────────────────────────────────────
  server.post(
    "/v1/agent/settle",
    {
      schema: {
        body: z.object({
          invoice_id: z.string(),
          tx_hash: z.string(),
        }),
      },
    },
    async (request, reply) => {
      const { invoice_id, tx_hash } = request.body;

      const invoice = await Invoice.findOne({
        invoiceId: invoice_id,
        isAgenticPayment: true,
      });

      if (!invoice) {
        return reply.code(404).send({ error: "Agentic invoice not found" });
      }

      if (invoice.status === "expired") {
        return reply.code(410).send({
          error: "Invoice has expired",
          message: "Please create a new invoice.",
        });
      }

      if (invoice.status === "confirmed") {
        return reply.code(200).send({
          status: "already_confirmed",
          invoice_id: invoice.invoiceId,
          message: "This invoice is already confirmed.",
        });
      }

      // Record the tx_hash — the ConfirmationEngine will handle
      // actual verification via webhook events
      await Invoice.findByIdAndUpdate(invoice._id, {
        $set: {
          txHash: tx_hash,
          status:
            invoice.status === "pending" ? "mempool_detected" : invoice.status,
        },
      });

      server.log.info(
        `🤖 Agent submitted payment proof: ${invoice_id} → ${tx_hash}`,
      );

      return {
        status: "settlement_pending",
        invoice_id: invoice.invoiceId,
        tx_hash,
        message: `Payment registered. Waiting for ${invoice.requiredConfirmations} block confirmations.`,
        check_status: `GET /v1/invoices/${invoice_id}`,
      };
    },
  );

  // ──────────────────────────────────────────────
  // GET /v1/agent/status/:invoiceId — Quick Status Check
  // ──────────────────────────────────────────────
  server.get<{ Params: { invoiceId: string } }>(
    "/v1/agent/status/:invoiceId",
    async (request, reply) => {
      const { invoiceId } = request.params;

      const invoice = await Invoice.findOne({
        invoiceId,
        isAgenticPayment: true,
      });

      if (!invoice) {
        return reply.code(404).send({ error: "Agentic invoice not found" });
      }

      return {
        invoice_id: invoice.invoiceId,
        status: invoice.status,
        confirmations: invoice.confirmations,
        required_confirmations: invoice.requiredConfirmations,
        tx_hash: invoice.txHash || null,
        is_confirmed: invoice.status === "confirmed",
      };
    },
  );
}
