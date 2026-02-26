import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { TwoFactorController } from "../controllers/two-factor.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

/**
 * 🔐 Two-Factor Authentication Routes — /v1/merchants/me/2fa
 *
 * TOTP-based 2FA for merchant dashboard security:
 *   POST /v1/merchants/me/2fa/setup    → Generate secret & QR code
 *   POST /v1/merchants/me/2fa/enable   → Verify code & activate 2FA
 *   POST /v1/merchants/me/2fa/validate → Validate a TOTP code (login/step-up)
 *   POST /v1/merchants/me/2fa/disable  → Disable 2FA
 *   GET  /v1/merchants/me/2fa/status   → Check 2FA status
 */
export async function twoFactorRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // ──────────────────────────────────────────────
  // POST /v1/merchants/me/2fa/setup
  // Generate a TOTP secret and return a QR code
  // ──────────────────────────────────────────────
  server.post(
    "/v1/merchants/me/2fa/setup",
    { preHandler: requireAuth },
    TwoFactorController.setup,
  );

  // ──────────────────────────────────────────────
  // POST /v1/merchants/me/2fa/enable
  // Verify the first TOTP code and activate 2FA
  // ──────────────────────────────────────────────
  server.post(
    "/v1/merchants/me/2fa/enable",
    {
      preHandler: requireAuth,
      schema: {
        body: z.object({
          code: z.string().length(6),
        }),
      },
    },
    TwoFactorController.enable,
  );

  // ──────────────────────────────────────────────
  // POST /v1/merchants/me/2fa/validate
  // Validate a TOTP code (used for login challenge and step-up auth)
  // ──────────────────────────────────────────────
  server.post(
    "/v1/merchants/me/2fa/validate",
    {
      preHandler: requireAuth,
      schema: {
        body: z.object({
          code: z.string().min(6).max(8),
        }),
      },
    },
    TwoFactorController.validate,
  );

  // ──────────────────────────────────────────────
  // POST /v1/merchants/me/2fa/disable
  // Disable 2FA (requires a valid TOTP code to confirm)
  // ──────────────────────────────────────────────
  server.post(
    "/v1/merchants/me/2fa/disable",
    {
      preHandler: requireAuth,
      schema: {
        body: z.object({
          code: z.string().length(6),
        }),
      },
    },
    TwoFactorController.disable,
  );

  // ──────────────────────────────────────────────
  // GET /v1/merchants/me/2fa/status
  // Check if 2FA is enabled (used by login flow)
  // ──────────────────────────────────────────────
  server.get(
    "/v1/merchants/me/2fa/status",
    { preHandler: requireAuth },
    TwoFactorController.getStatus,
  );
}
