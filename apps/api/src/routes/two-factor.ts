import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { Merchant, User } from "@qodinger/knot-database";
import { generateSecret, generateURI, verifySync } from "otplib";
import * as QRCode from "qrcode";
import * as crypto from "crypto";

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
  // Middleware: Unified Auth (same as merchants.ts)
  // ──────────────────────────────────────────────
  const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    // API Key auth
    const apiKey = request.headers["x-api-key"] as string;
    if (apiKey) {
      const apiKeyHash = crypto
        .createHash("sha256")
        .update(apiKey)
        .digest("hex");
      const merchant = await Merchant.findOne({ apiKeyHash, isActive: true });
      if (merchant) {
        request.merchant = merchant;
        return;
      }
      return reply.code(401).send({ error: "Invalid API Key" });
    }

    // Internal OAuth proxy auth
    const oauthId = request.headers["x-oauth-id"] as string;
    const merchantId = request.headers["x-merchant-id"] as string;
    const secret = request.headers["x-internal-secret"] as string;

    if (oauthId && secret === process.env.INTERNAL_SECRET) {
      const query: Record<string, unknown> = {
        oauthId: { $regex: new RegExp(`^${oauthId}(:|$)`) },
        isActive: true,
      };
      if (merchantId) query._id = merchantId;

      const merchant = await Merchant.findOne(query);
      if (merchant) {
        request.merchant = merchant;
        return;
      }
      return reply.code(401).send({ error: "Merchant not found" });
    }

    return reply.code(401).send({ error: "Unauthorized" });
  };

  // ──────────────────────────────────────────────
  // POST /v1/merchants/me/2fa/setup
  // Generate a TOTP secret and return a QR code
  // ──────────────────────────────────────────────
  server.post(
    "/v1/merchants/me/2fa/setup",
    { preHandler: requireAuth },
    async (request, reply) => {
      const merchant = request.merchant;
      if (!merchant) return reply.code(500).send({ error: "Auth failed" });

      const user = merchant.userId
        ? await User.findById(merchant.userId)
        : null;
      if (!user)
        return reply.code(400).send({ error: "User identity not found." });

      if (user.twoFactorEnabled) {
        return reply.code(400).send({
          error:
            "Two-factor authentication is already enabled. Disable it first to reconfigure.",
        });
      }

      // Generate a new TOTP secret
      const secret = generateSecret();
      const merchantName = merchant.name || "KnotEngine Merchant";
      const issuer = "KnotEngine";

      // Build the otpauth URI
      const otpauthUrl = generateURI({
        secret,
        issuer,
        label: merchantName,
      });

      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

      // Save the secret temporarily (not yet enabled)
      await User.findByIdAndUpdate(user._id, {
        $set: { twoFactorSecret: secret },
      });

      server.log.info(`🔐 2FA setup initiated for merchant: ${merchant._id}`);

      return reply.code(200).send({
        secret,
        qrCode: qrCodeDataUrl,
        otpauthUrl,
        message:
          "Scan the QR code with your authenticator app, then verify with a code to enable 2FA.",
      });
    },
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
    async (request, reply) => {
      const merchant = request.merchant;
      if (!merchant) return reply.code(500).send({ error: "Auth failed" });

      const user = merchant.userId
        ? await User.findById(merchant.userId)
        : null;
      if (!user)
        return reply.code(400).send({ error: "User identity not found." });

      if (user.twoFactorEnabled) {
        return reply
          .code(400)
          .send({ error: "Two-factor authentication is already enabled." });
      }

      if (!user.twoFactorSecret) {
        return reply.code(400).send({
          error:
            "No 2FA setup in progress. Call /2fa/setup first to generate a secret.",
        });
      }

      const { code } = request.body;

      // Verify the TOTP code against the saved secret
      const result = verifySync({
        token: code,
        secret: user.twoFactorSecret,
      });

      if (!result.valid) {
        return reply.code(400).send({
          error: "Invalid verification code. Please try again.",
        });
      }

      // Generate 5 one-time-use backup codes
      const backupCodes = Array.from({ length: 5 }, () =>
        crypto.randomBytes(4).toString("hex").toUpperCase(),
      );

      // Hash backup codes before persisting
      const hashedBackupCodes = backupCodes.map((c) =>
        crypto.createHash("sha256").update(c).digest("hex"),
      );

      // Enable 2FA
      await User.findByIdAndUpdate(user._id, {
        $set: {
          twoFactorEnabled: true,
          twoFactorBackupCodes: hashedBackupCodes,
        },
      });

      server.log.info(`🔐 2FA enabled for merchant: ${merchant._id}`);

      return reply.code(200).send({
        enabled: true,
        backupCodes,
        message:
          "Two-factor authentication is now active. Save these backup codes securely — they will not be shown again.",
      });
    },
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
    async (request, reply) => {
      const merchant = request.merchant;
      if (!merchant) return reply.code(500).send({ error: "Auth failed" });

      const user = merchant.userId
        ? await User.findById(merchant.userId)
        : null;
      if (!user)
        return reply.code(400).send({ error: "User identity not found." });

      if (!user.twoFactorEnabled || !user.twoFactorSecret) {
        return reply.code(400).send({
          error: "Two-factor authentication is not enabled on this account.",
        });
      }

      const { code } = request.body;

      // 1. Try standard TOTP verification
      const result = verifySync({
        token: code,
        secret: user.twoFactorSecret,
      });

      if (result.valid) {
        return reply.code(200).send({ valid: true });
      }

      // 2. Try backup code verification
      const codeHash = crypto
        .createHash("sha256")
        .update(code.toUpperCase())
        .digest("hex");

      const backupCodes = user.twoFactorBackupCodes || [];
      const backupIndex = backupCodes.findIndex((bc) => bc === codeHash);

      if (backupIndex !== -1) {
        // Remove the used backup code
        const updatedCodes = [...backupCodes];
        updatedCodes.splice(backupIndex, 1);

        await User.findByIdAndUpdate(user._id, {
          $set: { twoFactorBackupCodes: updatedCodes },
        });

        server.log.warn(
          `⚠️ Backup code used for merchant: ${merchant._id}. ${updatedCodes.length} codes remaining.`,
        );

        return reply.code(200).send({
          valid: true,
          usedBackupCode: true,
          remainingBackupCodes: updatedCodes.length,
        });
      }

      return reply.code(401).send({
        valid: false,
        error: "Invalid verification code.",
      });
    },
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
    async (request, reply) => {
      const merchant = request.merchant;
      if (!merchant) return reply.code(500).send({ error: "Auth failed" });

      const user = merchant.userId
        ? await User.findById(merchant.userId)
        : null;
      if (!user)
        return reply.code(400).send({ error: "User identity not found." });

      if (!user.twoFactorEnabled || !user.twoFactorSecret) {
        return reply.code(400).send({
          error: "Two-factor authentication is not currently enabled.",
        });
      }

      const { code } = request.body;

      // Verify the TOTP code before allowing disable
      const result = verifySync({
        token: code,
        secret: user.twoFactorSecret,
      });

      if (!result.valid) {
        return reply.code(401).send({
          error: "Invalid code. You must verify your identity to disable 2FA.",
        });
      }

      // Disable 2FA and clean up secrets
      await User.findByIdAndUpdate(user._id, {
        $set: {
          twoFactorEnabled: false,
        },
        $unset: {
          twoFactorSecret: 1,
          twoFactorBackupCodes: 1,
        },
      });

      server.log.info(`🔐 2FA disabled for merchant: ${merchant._id}`);

      return reply.code(200).send({
        enabled: false,
        message: "Two-factor authentication has been disabled.",
      });
    },
  );

  // ──────────────────────────────────────────────
  // GET /v1/merchants/me/2fa/status
  // Check if 2FA is enabled (used by login flow)
  // ──────────────────────────────────────────────
  server.get(
    "/v1/merchants/me/2fa/status",
    { preHandler: requireAuth },
    async (request, reply) => {
      const merchant = request.merchant;
      if (!merchant) return reply.code(500).send({ error: "Auth failed" });

      const user = merchant.userId
        ? await User.findById(merchant.userId)
        : null;

      return reply.code(200).send({
        enabled: user?.twoFactorEnabled === true,
      });
    },
  );
}
