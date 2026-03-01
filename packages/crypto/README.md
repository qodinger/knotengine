# 🔐 @qodinger/knot-crypto

Cryptographic utilities for [KnotEngine](https://github.com/qodinger/knotengine).

This package provides secure HD wallet derivation and webhook signature verification logic used throughout the KnotEngine ecosystem. It is designed to be lightweight and strictly non-custodial.

## 🛠️ Features

- **HD Wallet Derivation**: Derives hardened and non-hardened paths for BTC (P2WPKH) and EVM-compatible chains.
- **Webhook Signing**: Implements robust HMAC-SHA256 signing for secure merchant notifications.
- **Address Validation**: Checksum and format validation across supported blockchain networks.

## 🚀 Installation

```bash
npm install @qodinger/knot-crypto
```

## 📖 Usage

### Webhook Signature Verification

Verify that a webhook event actually came from your KnotEngine instance:

```javascript
import { Derivator } from "@qodinger/knot-crypto";

const isValid = Derivator.verifyWebhookSignature(
  rawBodyPayload, // The raw JSON string from the request body
  signatureHeader, // The 'x-knot-signature' header
  merchantSecret, // The secret shared with the merchant
);
```

### HD Wallet Derivation

Derive recipient addresses from an xPub:

```javascript
import { Derivator } from "@qodinger/knot-crypto";

const address = Derivator.deriveAddress(xpub, index, "BTC", "mainnet");
```

## 📄 License

AGPL-3.0
