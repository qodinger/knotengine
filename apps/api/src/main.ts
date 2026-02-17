import Fastify from "fastify";
import cors from "@fastify/cors";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { merchantRoutes } from "./routes/merchants";
import { PriceOracle } from "./infra/price-feed";
import { Currency } from "@tyepay/types";
import { connectToDatabase } from "@tyepay/database";

const server = Fastify({
  logger: true,
});

// Zod validation integration
server.setValidatorCompiler(validatorCompiler);
server.setSerializerCompiler(serializerCompiler);

server.register(cors, {
  origin: "*",
});

server.get("/health", async () => {
  return { status: "ok", timestamp: new Date() };
});

// Register Merchant Routes
server.register(merchantRoutes);

/**
 * 🛠️ Phase 1 Test Endpoint: Price Oracle
 * Verifies that the internal price feed is working.
 */
server.get<{ Params: { currency: string } }>(
  "/v1/price/:currency",
  async (request, reply) => {
    const { currency } = request.params;
    try {
      // Cast to known currency type (e.g. BTC, LTC)
      // In production, validate this with Zod enum
      const price = await PriceOracle.getPrice(
        currency.toUpperCase() as Currency,
      );
      return {
        asset: currency.toUpperCase(),
        price_usd: price,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      return reply.code(400).send({
        error: "Price Fetch Failed",
        details: err.message,
      });
    }
  },
);

/**
 * 🤖 Phase 1 Test Endpoint: x402 Agent Bridge
 * Verifies that the engine can talk to AI agents.
 */
server.get("/v1/agent/test", async (request, reply) => {
  return reply
    .code(402)
    .header("WWW-Authenticate", 'Token realm="TyePay", price="0.0001 BTC"')
    .send({
      error: "Payment Required",
      message: "This endpoint requires a micropayment via x402 protocol.",
      payment_details: {
        amount: 0.0001,
        currency: "BTC",
        address: "bc1qs0...", // Mock address for test
      },
    });
});

const start = async () => {
  try {
    await connectToDatabase(
      process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/tyepay",
    );
    await server.listen({ port: 3000, host: "0.0.0.0" });
    console.log("🚀 Knot Engine running on http://localhost:3000");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
