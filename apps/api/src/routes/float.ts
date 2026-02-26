import { FastifyInstance } from "fastify";
import { z } from "zod";
import { FloatController } from "../controllers/float.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export async function floatRoutes(server: FastifyInstance) {
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
    FloatController.getStats,
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
    FloatController.investFloat,
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
    FloatController.getHealth,
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
    FloatController.emergencyWithdraw,
  );
}
