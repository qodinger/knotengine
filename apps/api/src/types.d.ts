import { IMerchant } from "@knotengine/database";

declare module "fastify" {
  interface FastifyRequest {
    merchant?: IMerchant;
  }
}
