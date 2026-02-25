import dedent from "dedent";

/**
 * 📧 Email Templates
 * Centralized HTML templates for all system emails sent via Resend.
 */

export const EmailTemplates = {
  /**
   * 🪄 Magic Link Login Email
   */
  getMagicLinkHtml: (magicLink: string) => dedent`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="dark">
      <meta name="supported-color-schemes" content="dark">
      <title>Sign in to KnotEngine</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        
        :root {
          color-scheme: dark;
          supported-color-schemes: dark;
        }

        @media only screen and (max-width: 600px) {
          .container {
            padding: 20px 10px !important;
          }
          .card {
            padding: 32px 24px !important;
            border-radius: 16px !important;
          }
          .title {
            font-size: 20px !important;
          }
          .button {
            width: 100% !important;
            box-sizing: border-box !important;
          }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #050505; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #ffffff;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #050505;">
        <tr>
          <td align="center" class="container" style="padding: 40px 20px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" class="card" style="max-width: 440px; background-color: #0c0c0c; border: 1px solid #1a1a1a; border-radius: 20px; overflow: hidden;">
              
              <!-- Brand Header -->
              <tr>
                <td align="center" style="padding: 32px 0 24px 0;">
                  <div style="font-size: 16px; font-weight: 800; letter-spacing: 0.15em; color: #ffffff; text-transform: uppercase;">
                    KNOT<span style="color: #6366f1;">ENGINE</span>
                  </div>
                </td>
              </tr>
              
              <!-- Hero Section -->
              <tr>
                <td align="center" style="padding: 0 32px 32px 32px; text-align: center;">
                  <h1 class="title" style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 12px 0; letter-spacing: -0.02em; line-height: 1.2;">
                    Your dashboard is ready.
                  </h1>
                  <p style="color: #888888; font-size: 15px; line-height: 1.5; margin: 0 0 28px 0;">
                    Securely sign in to your workspace to manage global payments and settlements.
                  </p>
                  
                  <!-- CTA Button -->
                  <div style="margin-bottom: 32px;">
                    <a href="${magicLink}" class="button" style="display: inline-block; background-color: #ffffff; color: #000000; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; letter-spacing: -0.01em;">
                      Sign in to Dashboard
                    </a>
                  </div>
                  
                  <div style="height: 1px; background-color: #1a1a1a; margin-bottom: 24px; width: 100%;"></div>
                  
                  <p style="color: #4c4c4c; font-size: 12px; line-height: 1.6; margin: 0; max-width: 300px; margin: 0 auto;">
                    This link expires in 15 minutes.<br>
                    Safely ignore this if you did not request it.
                  </p>
                </td>
              </tr>
              
              <!-- Minimal Footer -->
              <tr>
                <td align="center" style="padding: 20px 0; background-color: #090909; border-top: 1px solid #1a1a1a;">
                  <p style="color: #333333; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin: 0;">
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
};
