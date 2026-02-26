/**
 * 🧪 Email Service Test Script
 *
 * Run this to test Gmail SMTP email sending
 * Usage: pnpm tsx scripts/test-email.ts
 */

import { config } from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { EmailService } from "../src/infra/email-service.js";

// Load environment variables from .env.development (in project root)
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "../../../.env.development");
console.log("📍 Loading .env from:", envPath);
config({ path: envPath });

// Verify env loaded
console.log("🔍 Checking env vars...");
console.log("   GMAIL_USER:", process.env.GMAIL_USER ? "SET" : "NOT SET");
console.log(
  "   GMAIL_APP_PASSWORD:",
  process.env.GMAIL_APP_PASSWORD
    ? "SET (length: " + process.env.GMAIL_APP_PASSWORD?.length + ")"
    : "NOT SET",
);
console.log("");

async function testEmailService() {
  console.log("🧪 Testing Email Service...\n");

  // Test 1: Connection
  console.log("1️⃣ Testing Gmail SMTP connection...");
  const connectionOk = await EmailService.testConnection();

  if (!connectionOk) {
    console.error("❌ Connection failed! Check your Gmail credentials in .env");
    console.log("\n📝 Troubleshooting:");
    console.log("   - Check GMAIL_USER matches your Gmail account");
    console.log("   - Verify GMAIL_APP_PASSWORD (no spaces)");
    console.log("   - Ensure 2FA is enabled on Gmail account");
    console.log("   - See: docs/EMAIL_QUICK_SETUP.md\n");
    process.exit(1);
  }

  console.log("✅ Connection successful!\n");

  // Test 2: Send test email
  console.log("2️⃣ Sending test email...");
  const testEmail = process.env.TEST_EMAIL || "sengphachanh.dev@gmail.com";

  const result = await EmailService.sendPaymentAlert({
    to: testEmail,
    merchantName: "Test Merchant",
    invoiceId: "inv_test123",
    amount: "100.00",
    currency: "USD",
    status: "received",
    checkoutUrl: "http://localhost:5052/dashboard/payments",
  });

  if (result.success) {
    console.log(`✅ Test email sent to ${testEmail}`);
    console.log("\n📬 Check your inbox!");
    console.log("   Subject: Payment Received - 100.00 USD\n");
  } else {
    console.error("❌ Failed to send email:", result.error);
    console.log("\n📝 Troubleshooting:");
    console.log("   - Check FROM_EMAIL matches GMAIL_USER");
    console.log("   - Verify recipient email address");
    console.log("   - Check Gmail sent folder for delivery issues\n");
    process.exit(1);
  }

  console.log("✅ All tests passed!\n");
}

// Run the test
testEmailService().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
