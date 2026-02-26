import { FastifyReply, FastifyRequest } from "fastify";
import { FloatManager } from "../core/float-manager.js";

export const FloatController = {
  getStats: async (request: FastifyRequest, reply: FastifyReply) => {
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
      return reply.code(500).send({ error: "Failed to get float statistics" });
    }
  },

  investFloat: async (request: FastifyRequest, reply: FastifyReply) => {
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

  getHealth: async (request: FastifyRequest, reply: FastifyReply) => {
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

  emergencyWithdraw: async (request: FastifyRequest, reply: FastifyReply) => {
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
};
