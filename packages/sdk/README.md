# 🧶 @qodinger/knot-sdk

Official Node.js SDK for KnotEngine — The Minimalist, Non-Custodial Crypto Payment Gateway.

## 🚀 Installation

```bash
npm install @qodinger/knot-sdk
# or
pnpm add @qodinger/knot-sdk
```

## 🛠️ Usage

```javascript
import { KnotClient } from "@qodinger/knot-sdk";

const knot = new KnotClient({
  apiKey: "knot_sk_your_api_key",
  // Optional: override API endpoint
  // endpoint: 'https://api.knotengine.com'
});

// 1. Create an Invoice
const invoice = await knot.createInvoice({
  amount_usd: 49.99,
  currency: "BTC",
  metadata: {
    orderId: "12345",
  },
});

console.log(`Please pay to: ${invoice.pay_address}`);
console.log(`Checkout URL: ${invoice.checkout_url}`);

// 2. Verify a Webhook Signature
const isValid = knot.verifyWebhook(rawBody, signature, webhookSecret);
```

## 🛡️ Trust & Security

KnotEngine is strictly **non-custodial**. This SDK interacts with the KnotEngine API to manage invoices and store configurations, but never handles your private keys or seed phrases. All funds are derived using your public `xPub` and deposited directly into your wallet.

## 📄 License

MIT
