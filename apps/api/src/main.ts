import Fastify from "fastify";
import cors from "@fastify/cors";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { merchantRoutes } from "./routes/merchants";
import { invoiceRoutes } from "./routes/invoices";
import { webhookRoutes } from "./routes/webhooks";
import { PriceOracle } from "./infra/price-feed";
import { ConfirmationEngine } from "./core/confirmation-engine";
import { WebhookDispatcher } from "./infra/webhook-dispatcher";
import { Currency } from "@tyepay/types";
import { connectToDatabase } from "@tyepay/database";
import { SocketService } from "./infra/socket-service";

import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import packageJson from "../package.json";

// Load .env from monorepo root
// Try multiple paths to ensure we find the environment variables
const possibleEnvPaths = [
  path.resolve(__dirname, "../../../.env"), // Monorepo root from built dist/ src/
  path.resolve(process.cwd(), ".env"), // Current working directory
  path.resolve(process.cwd(), "../../.env"), // Two levels up from CWD
];

let envLoaded = false;
for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`✅ Loaded .env from ${envPath}`);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn(
    "⚠️  No .env file found. Relying on system environment variables.",
  );
}

const server = Fastify({
  logger: true,
});

// Zod validation integration
server.setValidatorCompiler(validatorCompiler);
server.setSerializerCompiler(serializerCompiler);

server.register(cors, {
  origin: "*",
});

// Initialize real-time updates
SocketService.init(server.server);

// ──────────────────────────────────────────────
// Health Check
// ──────────────────────────────────────────────
server.get("/health", async () => {
  return {
    status: "ok",
    engine: `Knot v${packageJson.version}`,
    phase: "Phase 2 — Monitoring & Persistence",
    timestamp: new Date().toISOString(),
  };
});

// ──────────────────────────────────────────────
// Route Registration
// ──────────────────────────────────────────────
server.register(merchantRoutes);
server.register(invoiceRoutes);
server.register(webhookRoutes);

// ──────────────────────────────────────────────
// Price Oracle Endpoint (Phase 1)
// ──────────────────────────────────────────────
server.get<{ Params: { currency: string } }>(
  "/v1/price/:currency",
  async (request, reply) => {
    const { currency } = request.params;
    try {
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

// ──────────────────────────────────────────────
// Background Jobs
// ──────────────────────────────────────────────
let expirationInterval: NodeJS.Timeout;
let webhookCatchupInterval: NodeJS.Timeout;

function startBackgroundJobs() {
  // Expire stale invoices every 60 seconds
  expirationInterval = setInterval(async () => {
    try {
      await ConfirmationEngine.expireStaleInvoices();
    } catch (err) {
      console.error("Expiration job error:", err);
    }
  }, 60 * 1000);

  // Retry failed webhook deliveries every 5 minutes
  webhookCatchupInterval = setInterval(
    async () => {
      try {
        await WebhookDispatcher.dispatchPending();
      } catch (err) {
        console.error("Webhook catchup job error:", err);
      }
    },
    5 * 60 * 1000,
  );

  console.log("⏰ Background jobs started (expiration + webhook catchup)");
}

// ──────────────────────────────────────────────
// Server Startup
// ──────────────────────────────────────────────
const start = async () => {
  try {
    const mongoUri =
      process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/tyepay";

    await connectToDatabase(mongoUri);

    startBackgroundJobs();

    const port = parseInt(process.env.PORT || "3000", 10);
    await server.listen({ port, host: "0.0.0.0" });
    console.log(
      `🚀 Knot Engine v${packageJson.version} running on http://localhost:${port}`,
    );

    console.log("⚡ Socket.io ready for real-time updates");
    console.log("📋 Phase 2: Monitoring & Persistence — ACTIVE");
  } catch (err) {
    server.log.error(err);
    clearInterval(expirationInterval);
    clearInterval(webhookCatchupInterval);
    process.exit(1);
  }
};

start();
