import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { VerificationToken, User } from "@qodinger/knot-database";
import { Resend } from "resend";
import * as crypto from "crypto";

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
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Sign in to KnotEngine</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
                <tr>
                  <td align="center" style="padding: 40px 0;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #0a0a0a; border: 1px solid #222; border-radius: 16px; overflow: hidden;">
                      <!-- Header/Logo Area -->
                      <tr>
                        <td align="center" style="padding: 40px 40px 20px 40px;">
                          <div style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
                            KNOT<span style="color: #6366f1;">ENGINE</span>
                          </div>
                        </td>
                      </tr>
                      
                      <!-- Main Content -->
                      <tr>
                        <td style="padding: 20px 40px 40px 40px; text-align: center;">
                          <h1 style="color: #ffffff; font-size: 22px; font-weight: 600; margin: 0 0 16px 0;">Magic Link Login</h1>
                          <p style="color: #a1a1aa; font-size: 16px; line-height: 24px; margin: 0 0 32px 0;">
                            Click the button below to sign in to your merchant dashboard securely. This link is valid for 15 minutes.
                          </p>
                          
                          <!-- Action Button -->
                          <a href="${magicLink}" style="display: inline-block; background-color: #ffffff; color: #000000; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 16px; transition: all 0.2s ease;">
                            Sign in to Dashboard
                          </a>
                          
                          <p style="color: #52525b; font-size: 13px; margin-top: 40px; line-height: 20px;">
                            If you didn't request this email, you can safely ignore it. For your security, please do not forward this email to anyone.
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td align="center" style="padding: 20px 40px; background-color: #111; border-top: 1px solid #222;">
                          <p style="color: #71717a; font-size: 12px; margin: 0;">
                            &copy; ${new Date().getFullYear()} KnotEngine. All rights reserved.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `,
        });

        if (error) {
          server.log.error(error, `❌ Failed to send magic link to ${email}`);
          return reply.code(500).send({
            error: "Failed to send email",
            details: error.message,
            code:
              (error as Error & { code?: string }).name ||
              (error as Error & { code?: string }).code,
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
