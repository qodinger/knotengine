import { IMerchant } from "@qodinger/knot-database";

declare module "fastify" {
  interface FastifyRequest {
    merchant?: IMerchant;
  }
}
