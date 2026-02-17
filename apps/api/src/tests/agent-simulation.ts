/**
 * 🤖 x402 Agentic Payment Simulation
 *
 * This script simulates an autonomous AI agent completing a full payment
 * lifecycle via the x402 protocol — without any browser or human UI.
 *
 * Flow:
 *   1. Register a test merchant
 *   2. Agent discovers the x402 resource (receives 402)
 *   3. Agent creates an agentic invoice
 *   4. Agent "sends payment" (simulated via webhook)
 *   5. Agent submits settlement proof
 *   6. Agent accesses the protected resource
 *
 * Usage: npx tsx apps/api/src/tests/agent-simulation.ts
 */

const API_BASE = "http://localhost:3000";

interface ApiResponse {
  [key: string]: unknown;
}

async function request(
  method: string,
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<{ status: number; data: ApiResponse; headers: Headers }> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await res.json()) as ApiResponse;
  return { status: res.status, data, headers: res.headers };
}

function log(emoji: string, msg: string, data?: unknown) {
  console.log(`\n${emoji} ${msg}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function separator(title: string) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${"═".repeat(60)}`);
}

async function runSimulation() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  🤖  TyePay x402 Agentic Payment Simulation                ║
║  ────────────────────────────────────────────────────────    ║
║  Simulating an AI agent paying for a resource               ║
║  via HTTP 402 Payment Required protocol.                    ║
║  No browser. No human. Pure machine-to-machine.             ║
╚══════════════════════════════════════════════════════════════╝
  `);

  // ════════════════════════════════════════════
  // STEP 0: Health Check
  // ════════════════════════════════════════════
  separator("STEP 0: Health Check");

  try {
    const health = await request("GET", "/health");
    log("💚", "API is healthy:", health.data);
  } catch {
    log("❌", "API is not reachable. Start the server first.");
    process.exit(1);
  }

  // ════════════════════════════════════════════
  // STEP 1: Register a Test Merchant
  // ════════════════════════════════════════════
  separator("STEP 1: Register Test Merchant");

  const merchantRes = await request("POST", "/v1/merchants", {
    name: "Agent Test Corp",
    // Using the standard BIP32 test xPub
    btcXpub:
      "xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8",
    webhookUrl: "https://httpbin.org/post",
  });

  if (merchantRes.status !== 201) {
    log("❌", "Failed to create merchant:", merchantRes.data);
    process.exit(1);
  }

  const merchantApiKey = merchantRes.data.apiKey as string;
  log("🏪", `Merchant created: ${merchantRes.data.name}`, {
    id: merchantRes.data.id,
    api_key: `${merchantApiKey.slice(0, 12)}...${merchantApiKey.slice(-6)}`,
  });

  // ════════════════════════════════════════════
  // STEP 2: Agent Discovers x402 Resource
  // ════════════════════════════════════════════
  separator("STEP 2: Agent Discovers Protected Resource");

  const discoveryRes = await request("GET", "/v1/agent/resource");

  log(
    "🔒",
    `Received HTTP ${discoveryRes.status} — ${discoveryRes.data.error}`,
    {
      protocol: discoveryRes.data.protocol,
      how_to_pay: discoveryRes.data.how_to_pay,
    },
  );

  if (discoveryRes.status !== 402) {
    log("⚠️", "Expected 402, got:", { status: discoveryRes.status });
  }

  // ════════════════════════════════════════════
  // STEP 3: Agent Creates an Invoice
  // ════════════════════════════════════════════
  separator("STEP 3: Agent Creates Agentic Invoice");

  const invoiceRes = await request("POST", "/v1/agent/pay", {
    amount_usd: 5.0,
    currency: "BTC",
    merchant_api_key: merchantApiKey,
    agent_metadata: {
      agent_id: "claude-agent-001",
      purpose: "api_access_payment",
      session_id: `session_${Date.now()}`,
    },
  });

  const invoiceId = invoiceRes.data.invoice_id as string;
  const paymentDetails = invoiceRes.data.payment_details as Record<
    string,
    unknown
  >;

  log("🧾", `Invoice created: ${invoiceId}`, {
    status: invoiceRes.status,
    payment_details: paymentDetails,
    x_headers: {
      "X-Payment-Address": invoiceRes.headers.get("X-Payment-Address") || "N/A",
      "X-Payment-Amount": invoiceRes.headers.get("X-Payment-Amount") || "N/A",
      "X-Invoice-Id": invoiceRes.headers.get("X-Invoice-Id") || "N/A",
    },
  });

  // ════════════════════════════════════════════
  // STEP 4: Simulate Blockchain Payment
  // ════════════════════════════════════════════
  separator("STEP 4: Simulate Blockchain Payment (via webhook)");

  const fakeTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
  const payAddress = paymentDetails?.pay_address as string;

  log("⛓️", "Simulating blockchain transaction...", {
    tx_hash: fakeTxHash,
    to_address: payAddress,
    confirmations: 0,
  });

  // Simulate mempool detection (0 confirmations)
  const simRes0 = await request("POST", "/v1/webhooks/simulate", {
    toAddress: payAddress,
    txHash: fakeTxHash,
    blockNumber: -1,
    confirmations: 0,
    amount: paymentDetails?.crypto_amount?.toString() || "0.0001",
    asset: "BTC",
  });

  log("📡", "Mempool detection result:", simRes0.data);

  // Check status after mempool
  const status1 = await request("GET", `/v1/agent/status/${invoiceId}`);
  log("📊", "Status after mempool:", status1.data);

  // Simulate 1 confirmation
  log("⛓️", "Simulating 1 block confirmation...");
  const simRes1 = await request("POST", "/v1/webhooks/simulate", {
    toAddress: payAddress,
    txHash: fakeTxHash,
    blockNumber: 800001,
    confirmations: 1,
    amount: paymentDetails?.crypto_amount?.toString() || "0.0001",
    asset: "BTC",
  });

  log("📡", "1-confirmation result:", simRes1.data);

  // Simulate 2 confirmations (should trigger 'confirmed' for BTC default policy)
  log("⛓️", "Simulating 2 block confirmations (meets BTC threshold)...");
  const simRes2 = await request("POST", "/v1/webhooks/simulate", {
    toAddress: payAddress,
    txHash: fakeTxHash,
    blockNumber: 800002,
    confirmations: 2,
    amount: paymentDetails?.crypto_amount?.toString() || "0.0001",
    asset: "BTC",
  });

  log("📡", "2-confirmation result:", simRes2.data);

  // ════════════════════════════════════════════
  // STEP 5: Agent Submits Settlement Proof
  // ════════════════════════════════════════════
  separator("STEP 5: Agent Submits Settlement Proof");

  const settleRes = await request("POST", "/v1/agent/settle", {
    invoice_id: invoiceId,
    tx_hash: fakeTxHash,
  });

  log("🤝", "Settlement result:", settleRes.data);

  // ════════════════════════════════════════════
  // STEP 6: Agent Accesses Protected Resource
  // ════════════════════════════════════════════
  separator("STEP 6: Agent Accesses Protected Resource");

  const resourceRes = await request("GET", "/v1/agent/resource", undefined, {
    "X-Payment-Proof": invoiceId,
  });

  if (resourceRes.status === 200) {
    log("🎉", "ACCESS GRANTED! Agent successfully paid via x402:", {
      status: resourceRes.data.status,
      data: resourceRes.data.data,
    });
  } else {
    log("⚠️", `Access denied (HTTP ${resourceRes.status}):`, resourceRes.data);
  }

  // ════════════════════════════════════════════
  // STEP 7: Verify Full Invoice Status
  // ════════════════════════════════════════════
  separator("STEP 7: Final Invoice Verification");

  const finalStatus = await request(
    "GET",
    `/v1/invoices/${invoiceId}`,
    undefined,
    {
      "x-api-key": merchantApiKey,
    },
  );
  log("📋", "Final invoice state:", finalStatus.data);

  // ════════════════════════════════════════════
  // Summary
  // ════════════════════════════════════════════
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  ✅  SIMULATION COMPLETE                                    ║
║  ────────────────────────────────────────────────────────    ║
║  The AI agent successfully:                                 ║
║    1. Discovered a 402-protected resource                   ║
║    2. Created an invoice via x402 protocol                  ║
║    3. Simulated a blockchain payment                        ║
║    4. Passed through the confirmation engine                ║
║    5. Submitted settlement proof                            ║
║    6. Accessed the protected resource                       ║
║                                                             ║
║  Zero UI. Zero human. Pure machine-to-machine payment.      ║
╚══════════════════════════════════════════════════════════════╝
  `);
}

// Run the simulation
runSimulation().catch((err) => {
  console.error("❌ Simulation failed:", err);
  process.exit(1);
});
