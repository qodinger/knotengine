/**
 * 🧪 Auth Email Test Script
 *
 * Test Magic Link Login and Email Verification emails
 * Usage: pnpm tsx scripts/test-auth-emails.ts
 */

import { config } from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { EmailService } from "../src/infra/email-service.js";

// Load environment variables from .env.development
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../../../.env.development") });

async function testAuthEmails() {
  console.log("🧪 Testing Auth Email System...\n");

  // Test 1: Connection
  console.log("1️⃣ Testing Gmail SMTP connection...");
  const connectionOk = await EmailService.testConnection();

  if (!connectionOk) {
    console.error("❌ Connection failed! Check your Gmail credentials\n");
    process.exit(1);
  }

  console.log("✅ Connection successful!\n");

  const testEmail = process.env.TEST_EMAIL || "sengphachanh.dev@gmail.com";

  // Test 2: Magic Link Email
  console.log("2️⃣ Sending Magic Link Login email...");
  const magicLink =
    "http://localhost:5052/login/verify?token=test123&email=test@example.com";

  const magicLinkResult = await EmailService.sendMagicLink({
    to: testEmail,
    magicLink,
  });

  if (magicLinkResult.success) {
    console.log(`✅ Magic Link email sent to ${testEmail}`);
    console.log("   Subject: Sign in to KnotEngine\n");
  } else {
    console.error("❌ Failed to send Magic Link email:", magicLinkResult.error);
    process.exit(1);
  }

  // Test 3: Verification Email
  console.log("3️⃣ Sending Email Verification email...");
  const verificationLink =
    "http://localhost:5052/login/verify?token=verify456&email=test@example.com";

  const verificationResult = await EmailService.sendVerificationEmail({
    to: testEmail,
    verificationLink,
  });

  if (verificationResult.success) {
    console.log(`✅ Verification email sent to ${testEmail}`);
    console.log("   Subject: Verify your email - KnotEngine\n");
  } else {
    console.error(
      "❌ Failed to send Verification email:",
      verificationResult.error,
    );
    process.exit(1);
  }

  console.log("✅ All Auth Email tests passed!\n");
  console.log("📬 Check your inbox for 2 emails:");
  console.log("   1. Sign in to KnotEngine");
  console.log("   2. Verify your email - KnotEngine\n");
}

// Run the test
testAuthEmails().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
