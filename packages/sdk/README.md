# 🧶 @qodinger/knot-sdk

The official Node.js SDK for [KnotEngine](https://github.com/qodinger/knotengine) — a minimalist, non-custodial crypto payment gateway.

[![npm version](https://img.shields.io/npm/v/@qodinger/knot-sdk)](https://www.npmjs.com/package/@qodinger/knot-sdk)
[![License](https://img.shields.io/badge/license-AGPL--3.0-green.svg)](../../LICENSE)

## 🚀 Installation

```bash
npm install @qodinger/knot-sdk
# or
pnpm add @qodinger/knot-sdk
```

## 🛠️ Usage

### Initialize the Client

```javascript
import { KnotClient } from "@qodinger/knot-sdk";

const knot = new KnotClient({
  // Use knot_sk_live_... for production or knot_sk_test_... for development
  apiKey: "knot_sk_your_api_key",
  // In production, point to your deployed API: https://api.yourdomain.com
  baseUrl: process.env.KNOT_API_URL || "http://localhost:5050",
  // Optional: set the webhook secret for signature verification
  webhookSecret: "knot_wh_your_webhook_secret",
});
```

### Create an Invoice

```javascript
const invoice = await knot.createInvoice({
  amount_usd: 49.99,
  currency: "BTC",
  metadata: {
    orderId: "order_12345",
  },
});

console.log(`Pay to: ${invoice.pay_address}`);
console.log(`Checkout: ${invoice.checkout_url}`);
```

### Verify a Webhook Signature

```javascript
const isValid = knot.verifyWebhook(rawBody, signature);

// Or pass the secret manually
const isValidManual = knot.verifyWebhook(rawBody, signature, "knot_wh_secret");

if (!isValid) {
  return res.status(401).send("Unauthorized");
}

// Handle the verified event
const event = JSON.parse(rawBody);
if (event.event === "invoice.confirmed") {
  // Fulfill the order
}
```

## 🛡️ Trust & Security

KnotEngine is strictly **non-custodial**. This SDK interacts with the KnotEngine API to manage invoices and merchant configurations, but **never handles your private keys or seed phrases**. All funds are derived from your public `xPub` and deposited directly into your wallet.

## 📄 License

AGPL-3.0 — see [LICENSE](../../LICENSE) for details.
