import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { VerificationToken, User, AuditLog } from "@qodinger/knot-database";
import { Resend } from "resend";
import * as crypto from "crypto";
import { EmailTemplates } from "../core/email-templates.js";
import { AuditLogger } from "../core/audit-logger.js";

// In-memory rate limiting (simple, no Redis required)
const authRateLimits = new Map<string, { count: number; resetAt: number }>();

function checkAuthRateLimit(ip: string): {
  allowed: boolean;
  retryAfter?: number;
} {
  const now = Date.now();
  const limit = authRateLimits.get(ip);

  if (!limit || now > limit.resetAt) {
    authRateLimits.set(ip, { count: 1, resetAt: now + 60000 });
    return { allowed: true };
  }

  if (limit.count >= 5) {
    return {
      allowed: false,
      retryAfter: Math.ceil((limit.resetAt - now) / 1000),
    };
  }

  limit.count++;
  return { allowed: true };
}

export async function authRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  const DASHBOARD_URL = process.env.DASHBOARD_URL || "http://localhost:5052";

  // Initialize Resend inside the function to ensure process.env is populated
  const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

  // ──────────────────────────────────────────────
  // Rate Limiting for Auth Endpoints (5 req/min - Prevent brute force)
  // ──────────────────────────────────────────────
  server.addHook("preHandler", async (request, reply) => {
    // Skip rate limiting for localhost in development
    if (request.ip === "127.0.0.1" || request.ip === "::1") {
      return;
    }

    const result = checkAuthRateLimit(request.ip);
    if (!result.allowed) {
      return reply.code(429).send({
        error: "Too Many Requests",
        message: "Too many authentication attempts. Please try again later.",
        retryAfter: `${result.retryAfter}s`,
      });
    }
  });

  // ──────────────────────────────────────────────
  // POST /v1/auth/magic-link — Request a Login Link
  // ──────────────────────────────────────────────
  server.post(
    "/v1/auth/magic-link",
    {
      schema: {
        body: z.object({
          email: z.string().email(),
        }),
      },
    },
    async (request, reply) => {
      const { email } = request.body;
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Save token to DB
      await VerificationToken.create({
        identifier: email,
        token,
        expires,
      });

      const magicLink = `${DASHBOARD_URL}/login/verify?token=${token}&email=${encodeURIComponent(email)}`;

      // Send Email via Resend
      if (resend) {
        const { data, error } = await resend.emails.send({
          from: "KnotEngine <onboarding@resend.dev>",
          to: email,
          subject: "Sign in to KnotEngine",
          html: EmailTemplates.getMagicLinkHtml(magicLink),
        });

        if (error) {
          server.log.error(error, `❌ Failed to send magic link to ${email}`);
          return reply.code(500).send({
            error: "Unable to send magic link",
            message:
              "We encountered an issue sending your login email. Please try again later or contact support.",
          });
        }

        server.log.info(`✉️ Magic link sent to: ${email}, ID: ${data?.id}`);
      } else {
        server.log.warn(
          `⚠️ RESEND_API_KEY not set. Magic link for ${email}: ${magicLink}`,
        );
      }

      return { success: true, message: "Magic link sent" };
    },
  );

  // ──────────────────────────────────────────────
  // POST /v1/auth/verify — Exchange Token for Identity
  // ──────────────────────────────────────────────
  server.post(
    "/v1/auth/verify",
    {
      schema: {
        body: z.object({
          email: z.string().email(),
          token: z.string(),
        }),
      },
    },
    async (request, reply) => {
      const { email, token } = request.body;

      const vt = await VerificationToken.findOne({
        identifier: email,
        token,
        expires: { $gt: new Date() },
      });

      if (!vt) {
        return reply.code(401).send({ error: "Invalid or expired token" });
      }

      // Delete token after use
      await VerificationToken.deleteOne({ _id: vt._id });

      // Identify user by email
      const oauthId = `email:${email}`;
      let user = await User.findOne({ oauthId });

      if (!user) {
        // Create new user for this email with emailVerified = true
        user = await User.create({
          oauthId,
          email,
          emailVerified: true, // Email verified via magic link
          creditBalance: parseFloat(
            process.env.WELCOME_CREDIT_AMOUNT || "5.00",
          ),
          welcomeBonusClaimed: true,
          // Generate a referral code for them
          referralCode:
            "REF_" + crypto.randomBytes(4).toString("hex").toUpperCase(),
        });
        server.log.info(`👤 New User Identity created via Email: ${email}`);

        // Audit log
        await AuditLogger.account(user._id.toString(), "created", request, {
          email,
        });
        await AuditLogger.auth(user._id.toString(), "login", request, {
          method: "magic_link",
        });
      } else {
        // Mark email as verified for existing users
        if (!user.emailVerified) {
          await User.updateOne(
            { _id: user._id },
            { $set: { emailVerified: true } },
          );
          user.emailVerified = true;
          server.log.info(`✅ Email verified for: ${email}`);
          await AuditLogger.auth(
            user._id.toString(),
            "email_verified",
            request,
          );
        }
        // Log login
        await AuditLogger.auth(user._id.toString(), "login", request, {
          method: "magic_link",
        });
      }

      return {
        success: true,
        oauthId,
        email: user.email,
        emailVerified: user.emailVerified,
      };
    },
  );

  // ──────────────────────────────────────────────
  // POST /v1/auth/send-verification — Resend Verification Email
  // ──────────────────────────────────────────────
  server.post(
    "/v1/auth/send-verification",
    {
      schema: {
        body: z.object({
          email: z.string().email(),
        }),
      },
    },
    async (request, reply) => {
      const { email } = request.body;

      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal if email exists
        return {
          success: true,
          message: "If the email exists, a verification link has been sent",
        };
      }

      if (user.emailVerified) {
        return reply.code(400).send({
          error: "Email already verified",
          message: "This email is already verified. Please login.",
        });
      }

      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Save or update verification token
      await VerificationToken.deleteMany({ identifier: email });
      await VerificationToken.create({
        identifier: email,
        token,
        expires,
      });

      const verificationLink = `${DASHBOARD_URL}/login/verify?token=${token}&email=${encodeURIComponent(email)}`;

      // Send Email via Resend
      if (resend) {
        const { data, error } = await resend.emails.send({
          from: "KnotEngine <onboarding@resend.dev>",
          to: email,
          subject: "Verify your email - KnotEngine",
          html: EmailTemplates.getVerificationEmailHtml(
            verificationLink,
            email,
          ),
        });

        if (error) {
          server.log.error(
            error,
            `❌ Failed to send verification email to ${email}`,
          );
          return reply.code(500).send({
            error: "Unable to send verification email",
            message:
              "We encountered an issue sending your verification email. Please try again later.",
          });
        }

        server.log.info(
          `✉️ Verification email sent to: ${email}, ID: ${data?.id}`,
        );
      } else {
        server.log.warn(
          `⚠️ RESEND_API_KEY not set. Verification link for ${email}: ${verificationLink}`,
        );
      }

      return { success: true, message: "Verification email sent" };
    },
  );

  // ──────────────────────────────────────────────
  // GET /v1/auth/me — Get Current User Status
  // ──────────────────────────────────────────────
  server.get("/v1/auth/me", async (request, reply) => {
    const oauthId = request.headers["x-oauth-id"] as string;
    const internalSecret = request.headers["x-internal-secret"] as string;

    if (!oauthId || internalSecret !== process.env.INTERNAL_SECRET) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const user = await User.findOne({ oauthId });
    if (!user) {
      return reply.code(404).send({ error: "User not found" });
    }

    return {
      email: user.email,
      emailVerified: user.emailVerified,
      creditBalance: user.creditBalance,
      createdAt: user.createdAt,
    };
  });

  // ──────────────────────────────────────────────
  // GET /v1/auth/me/audit-logs — Get User Audit Logs
  // ──────────────────────────────────────────────
  server.get(
    "/v1/auth/me/audit-logs",
    {
      schema: {
        querystring: z.object({
          limit: z.coerce.number().int().min(1).max(100).default(20),
          offset: z.coerce.number().int().min(0).default(0),
          category: z
            .enum(["auth", "account", "security", "billing", "settings"])
            .optional(),
        }),
      },
    },
    async (request, reply) => {
      const oauthId = request.headers["x-oauth-id"] as string;
      const internalSecret = request.headers["x-internal-secret"] as string;

      if (!oauthId || internalSecret !== process.env.INTERNAL_SECRET) {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      const user = await User.findOne({ oauthId });
      if (!user) {
        return reply.code(404).send({ error: "User not found" });
      }

      const { limit, offset, category } = request.query;

      const logs = await AuditLogger.getUserLogs(user._id.toString(), {
        limit,
        offset,
        category,
      });

      const total = await AuditLog.countDocuments({
        userId: user._id,
        ...(category ? { category } : {}),
      });

      return {
        data: logs,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + logs.length < total,
        },
      };
    },
  );
}
