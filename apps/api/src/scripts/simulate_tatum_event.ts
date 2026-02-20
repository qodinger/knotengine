/**
 * 🧪 Test Tatum Webhook Simulation
 *
 * This script sends a dummy Tatum-style webhook payload to your local API.
 * This verifies that the API correctly handles Tatum events and routes them
 * to the ConfirmationEngine.
 */
async function simulateTatumWebhook() {
  const publicUrl = "https://2f0a-103-43-77-222.ngrok-free.app"; // Your live ngrok tunnel
  const endpoint = `${publicUrl}/v1/webhooks/tatum`;

  const payload = {
    address: "tb1q6whzw60jt8f88n62vf0y9t4x5x9g0245v43f5v", // The address we generated
    txId: "d6349c25f69e663a872653245642654321654321654321654321654321defabc", // Dummy hash
    blockNumber: 2500000,
    confirmations: 1,
    amount: 0.0005,
    asset: "BTC",
    type: "native",
  };

  console.log(`🚀 Sending simulated Tatum webhook to ${endpoint}...`);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("✅ Server Response:", data);

    if (data.matched === false) {
      console.log(
        "\n💡 Note: Partial Success. The webhook reached the server, but no active invoice was found for this address.",
      );
      console.log(
        "To see a full match, you must first create an invoice (via the simulation script or API) that uses this specific address.",
      );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ Failed to send webhook:", message);
  }
}

simulateTatumWebhook();
