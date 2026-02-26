import { FastifyInstance } from "fastify";
import { WebhooksController } from "../controllers/webhooks.controller.js";

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
   */
  app.get("/v1/webhooks/alchemy", WebhooksController.alchemyHealthCheck);
  app.post("/v1/webhooks/alchemy", WebhooksController.alchemyWebhook);

  /**
   * Tatum Webhook Endpoint
   * Receives transaction notifications for monitored addresses.
   */
  app.post("/v1/webhooks/tatum", WebhooksController.tatumWebhook);

  /**
   * Manual Confirmation Endpoint (Development Only)
   * Allows simulating a blockchain event for testing.
   */
  app.post("/v1/webhooks/simulate", WebhooksController.simulateWebhook);
}
