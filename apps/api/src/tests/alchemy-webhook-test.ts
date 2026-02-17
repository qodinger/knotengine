import * as crypto from "crypto";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

const API_Endpoint = "http://localhost:3000/v1/webhooks/alchemy";
const signingKey = process.env.ALCHEMY_WEBHOOK_SIGNING_KEY;

if (!signingKey) {
  console.error("❌ ALCHEMY_WEBHOOK_SIGNING_KEY is missing in .env");
  process.exit(1);
}

// 📦 Sample Payload (Simulating an incoming ETH transfer)
const payload = {
  webhookId: "wh_12345",
  id: "evt_67890",
  createdAt: new Date().toISOString(),
  type: "ADDRESS_ACTIVITY",
  event: {
    network: "ETH_MAINNET",
    activity: [
      {
        category: "external",
        fromAddress: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", // vitalik.eth
        toAddress: "0xYourMerchantAddressHere",
        blockNum: "0x123456",
        hash: "0xabcdef1234567890",
        value: 1.5, // 1.5 ETH
        asset: "ETH",
      },
    ],
  },
};

// 🔏 Function to sign payload (HMAC-SHA256)
function signPayload(body: any, key: string) {
  const hmac = crypto.createHmac("sha256", key);
  hmac.update(JSON.stringify(body));
  return hmac.digest("hex");
}

async function runTest() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  🧪  Alchemy Webhook Security Test                           ║
║  ────────────────────────────────────────────────────────    ║
║  Verifying signature logic using key:                        ║
║  ${signingKey!.slice(0, 10)}...${signingKey!.slice(-5)}      ║
╚══════════════════════════════════════════════════════════════╝
  `);

  // ➤ TEST 1: Valid Signature
  console.log("\n🔹 Test 1: Sending VALID request...");
  const validSignature = signPayload(payload, signingKey!);

  const resValid = await fetch(API_Endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Alchemy-Signature": validSignature,
    },
    body: JSON.stringify(payload),
  });

  if (resValid.status === 200) {
    console.log("✅ SUCCESS: Server accepted valid signature (HTTP 200)");
  } else {
    console.error(
      `❌ FAILED: Server rejected valid signature (HTTP ${resValid.status})`,
    );
    console.error(await resValid.text());
  }

  // ➤ TEST 2: Invalid Signature
  console.log("\n🔹 Test 2: Sending INVALID request (security check)...");
  const invalidSignature = "bad_signature_12345";

  const resInvalid = await fetch(API_Endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Alchemy-Signature": invalidSignature,
    },
    body: JSON.stringify(payload),
  });

  if (resInvalid.status === 401) {
    console.log(
      "✅ SUCCESS: Server correctly rejected bad signature (HTTP 401)",
    );
  } else {
    console.error(
      `❌ FAILED: Server Accepted BAD signature! (HTTP ${resInvalid.status})`,
    );
  }
}

runTest();
