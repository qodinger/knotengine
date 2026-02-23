import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { Merchant } from "@qodinger/knot-database";
import { FloatManager } from "../core/float-manager.js";

export async function floatRoutes(server: FastifyInstance) {
  // Middleware: Unified Auth (same as merchants.ts)
  const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    const apiKey = request.headers["x-api-key"];
    if (apiKey) {
      try {
        const merchant = await Merchant.findOne({ apiKeyHash: apiKey });
        if (merchant) {
          request.merchant = merchant;
          return;
        }
      } catch {
        // Invalid API key
      }
    }

    reply.code(401).send({ error: "Unauthorized" });
  };
  // ──────────────────────────────────────────────
  // GET /v1/float/stats — Get float statistics (admin only)
  // ──────────────────────────────────────────────
  server.get(
    "/v1/float/stats",
    {
      preHandler: requireAuth,
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              totalBalance: { type: "number" },
              investedAmount: { type: "number" },
              availableAmount: { type: "number" },
              estimatedYield: { type: "number" },
              yieldAPY: { type: "number" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const merchant = request.merchant;
      if (!merchant) return reply.code(401).send({ error: "Unauthorized" });

      // Only allow admin or enterprise users to view float stats
      if (merchant.plan !== "enterprise") {
        return reply.code(403).send({ error: "Enterprise plan required" });
      }

      try {
        const stats = await FloatManager.getInstance().getFloatStats();
        return reply.send(stats);
      } catch (error) {
        console.error("Float stats error:", error);
        return reply
          .code(500)
          .send({ error: "Failed to get float statistics" });
      }
    },
  );

  // ──────────────────────────────────────────────
  // POST /v1/float/invest — Manual float investment (admin only)
  // ──────────────────────────────────────────────
  server.post(
    "/v1/float/invest",
    {
      preHandler: requireAuth,
      schema: {
        body: z.object({
          amount: z.number().positive().optional(),
        }),
        response: {
          200: {
            type: "object",
            properties: {
              invested: { type: "number" },
              success: { type: "boolean" },
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const merchant = request.merchant;
      if (!merchant) return reply.code(401).send({ error: "Unauthorized" });

      // Only allow admin users
      if (merchant.plan !== "enterprise") {
        return reply.code(403).send({ error: "Enterprise plan required" });
      }

      try {
        const result = await FloatManager.getInstance().investFloat();
        return reply.send(result);
      } catch (error) {
        console.error("Float investment error:", error);
        return reply.code(500).send({ error: "Failed to invest float" });
      }
    },
  );

  // ──────────────────────────────────────────────
  // GET /v1/float/health — Get float health metrics (admin only)
  // ──────────────────────────────────────────────
  server.get(
    "/v1/float/health",
    {
      preHandler: requireAuth,
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              healthScore: { type: "number" },
              riskLevel: { type: "string", enum: ["low", "medium", "high"] },
              recommendations: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const merchant = request.merchant;
      if (!merchant) return reply.code(401).send({ error: "Unauthorized" });

      // Only allow admin users
      if (merchant.plan !== "enterprise") {
        return reply.code(403).send({ error: "Enterprise plan required" });
      }

      try {
        const health = await FloatManager.getInstance().getHealthMetrics();
        return reply.send(health);
      } catch (error) {
        console.error("Float health error:", error);
        return reply.code(500).send({ error: "Failed to get float health" });
      }
    },
  );

  // ──────────────────────────────────────────────
  // POST /v1/float/emergency-withdraw — Emergency withdrawal (admin only)
  // ──────────────────────────────────────────────
  server.post(
    "/v1/float/emergency-withdraw",
    {
      preHandler: requireAuth,
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              withdrawn: { type: "number" },
              success: { type: "boolean" },
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const merchant = request.merchant;
      if (!merchant) return reply.code(401).send({ error: "Unauthorized" });

      // Only allow admin users
      if (merchant.plan !== "enterprise") {
        return reply.code(403).send({ error: "Enterprise plan required" });
      }

      try {
        const result = await FloatManager.getInstance().emergencyWithdraw();
        return reply.send(result);
      } catch (error) {
        console.error("Emergency withdrawal error:", error);
        return reply.code(500).send({ error: "Failed to emergency withdraw" });
      }
    },
  );
}
