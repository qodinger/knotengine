import {
  ASSET_CONFIG,
  NETWORK_CONFIG,
  SUPPORTED_CURRENCIES,
} from "@qodinger/knot-types";
import { FastifyInstance } from "fastify";

export async function configRoutes(app: FastifyInstance) {
  /**
   * GET /v1/config/assets
   * Returns supported assets and their network configurations for the UI
   */
  app.get("/v1/config/assets", async () => {
    return {
      assets: ASSET_CONFIG,
      networks: NETWORK_CONFIG,
      supportedCurrencies: SUPPORTED_CURRENCIES,
    };
  });
}
