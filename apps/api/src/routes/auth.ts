import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { VerificationToken, User } from "@qodinger/knot-database";
import { Resend } from "resend";
import * as crypto from "crypto";
import { EmailTemplates } from "../core/email-templates.js";

export async function authRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  const DASHBOARD_URL = process.env.DASHBOARD_URL || "http://localhost:5052";

  // Initialize Resend inside the function to ensure process.env is populated
  const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

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
        // Create new user for this email
        user = await User.create({
          oauthId,
          email,
          creditBalance: parseFloat(
            process.env.WELCOME_CREDIT_AMOUNT || "5.00",
          ),
          welcomeBonusClaimed: true,
          // Generate a referral code for them
          referralCode:
            "REF_" + crypto.randomBytes(4).toString("hex").toUpperCase(),
        });
        server.log.info(`👤 New User Identity created via Email: ${email}`);
      }

      return {
        success: true,
        oauthId,
        email: user.email,
      };
    },
  );
}
