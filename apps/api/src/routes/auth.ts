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
              <link rel="preconnect" href="https://fonts.googleapis.com">
              <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
            </head>
            <body style="margin: 0; padding: 0; background-color: #050505; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
                <tr>
                  <td align="center" style="padding: 60px 20px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; background-color: #0c0c0c; border: 1px solid #1a1a1a; border-radius: 24px; overflow: hidden; box-shadow: 0 40px 100px -20px rgba(0,0,0,0.5);">
                      
                      <!-- Header -->
                      <tr>
                        <td align="center" style="padding: 48px 40px 32px 40px;">
                          <div style="font-size: 20px; font-weight: 800; letter-spacing: 0.1em; color: #ffffff; text-transform: uppercase;">
                            KNOT<span style="color: #6366f1;">ENGINE</span>
                          </div>
                        </td>
                      </tr>
                      
                      <!-- Main Content -->
                      <tr>
                        <td style="padding: 0 48px 48px 48px; text-align: center;">
                          <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; letter-spacing: -0.02em;">Your dashboard is ready.</h1>
                          <p style="color: #888888; font-size: 16px; line-height: 24px; margin: 0 0 32px 0;">
                            Securely sign in to your workspace to manage global payments and settlements.
                          </p>
                          
                          <!-- Action Button -->
                          <div style="margin-bottom: 40px;">
                            <a href="${magicLink}" style="display: inline-block; background-color: #ffffff; color: #000000; padding: 16px 36px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; letter-spacing: -0.01em;">
                              Sign in to Dashboard
                            </a>
                          </div>
                          
                          <div style="height: 1px; background-color: #1a1a1a; margin-bottom: 32px;"></div>
                          
                          <p style="color: #444444; font-size: 13px; line-height: 20px; margin: 0;">
                            This link expires in 15 minutes. Did not request this? You can safely ignore this email.
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td align="center" style="padding: 24px 40px; background-color: #080808; border-top: 1px solid #1a1a1a;">
                          <p style="color: #333333; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin: 0;">
                            &copy; ${new Date().getFullYear()} KnotEngine Protocol
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
